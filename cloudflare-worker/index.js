const ALLOWED_ORIGINS = new Set(["https://hakkabakka.in", "https://www.hakkabakka.in", "http://hakkabakka.in", "http://www.hakkabakka.in"]);
function cors(request) {
  const origin = request.headers.get("Origin") || "";
  const h = { "Vary": "Origin", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" };
  if (ALLOWED_ORIGINS.has(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}
function reply(request, data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors(request) } });
}
const digits = value => String(value || "").replace(/\D/g, "");
const validOrderNo = value => typeof value === "string" && (/^\d{4}\/(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\/\d{4,}$/.test(value) || /^HB-\d{8}-[A-Z0-9]{8}$/.test(value) || /^OC\d{1,10}$/.test(value)); // current YYYY/MMM/0001 plus legacy IDs
// Server-side price allowlist generated from the website menu at this commit. Keep in sync with index.html.
async function getCanonicalMenuPrice(env, itemName) {
  if (!env.MENU_DB) throw new Error("Menu database binding MENU_DB is missing");
  const row = await env.MENU_DB.prepare("SELECT price FROM menu_items WHERE name = ? AND is_published = 1 AND available = 1 LIMIT 1").bind(itemName).first();
  if (!row) return null;
  const price = Number(row.price);
  return Number.isFinite(price) && price > 0 ? price : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url), origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response("Origin not allowed", { status: 403 });
      return new Response(null, { status: 204, headers: cors(request) });
    }
    if (origin && !ALLOWED_ORIGINS.has(origin)) return reply(request, { success: false, message: "Origin not allowed" }, 403);
    if (!env.DB) return reply(request, { success: false, message: "Database binding DB is missing" }, 503);
    if (request.method === "GET" && url.pathname === "/health") {
      try {
        const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM orders").first();
        if (!env.MENU_DB) return reply(request, { success: false, message: "Menu database binding MENU_DB is missing" }, 503);
        const menu = await env.MENU_DB.prepare("SELECT COUNT(*) AS count FROM menu_items WHERE is_published = 1 AND available = 1").first();
        return reply(request, { success: true, service: "hb-orders-api", database: "connected", menu_database: "connected", count: Number(row?.count || 0), published_menu_count: Number(menu?.count || 0) });
      } catch { return reply(request, { success: false, message: "Database check failed" }, 500); }
    }
    if (request.method === "POST" && url.pathname === "/orders/next-number") {
      try {
        let p = {};
        try { p = await request.json(); } catch {}
        const checkoutKey = String(p?.checkout_key || "").trim();
        if (checkoutKey && !/^[A-Za-z0-9_-]{20,100}$/.test(checkoutKey)) return reply(request, { success: false, message: "Invalid checkout session. Refresh checkout and try again." }, 400);
        if (checkoutKey) {
          const existing = await env.DB.prepare("SELECT order_number FROM checkout_sessions WHERE checkout_key = ? LIMIT 1").bind(checkoutKey).first();
          if (existing?.order_number) return reply(request, { success: true, order_no: existing.order_number, reused: true });
        }
        const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).formatToParts(new Date());
        const year = parts.find(part => part.type === "year").value;
        const monthNumber = Number(parts.find(part => part.type === "month").value);
        const yearMonth = year + "-" + String(monthNumber).padStart(2, "0");
        const row = await env.DB.prepare("INSERT INTO order_counters (year_month, last_number) VALUES (?, 1) ON CONFLICT(year_month) DO UPDATE SET last_number = last_number + 1 RETURNING last_number").bind(yearMonth).first();
        if (!row || !Number.isInteger(Number(row.last_number))) throw new Error("Counter increment failed");
        const month = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][monthNumber - 1];
        const orderNo = year + "/" + month + "/" + String(row.last_number).padStart(4, "0");
        if (!checkoutKey) return reply(request, { success: true, order_no: orderNo, reused: false, legacy_client: true });
        try {
          await env.DB.prepare("INSERT INTO checkout_sessions (checkout_key, order_number) VALUES (?, ?)").bind(checkoutKey, orderNo).run();
          return reply(request, { success: true, order_no: orderNo, reused: false });
        } catch (error) {
          const same = await env.DB.prepare("SELECT order_number FROM checkout_sessions WHERE checkout_key = ? LIMIT 1").bind(checkoutKey).first().catch(() => null);
          if (same?.order_number) return reply(request, { success: true, order_no: same.order_number, reused: true });
          throw error;
        }
      } catch (error) { console.error("Order number allocation failed"); return reply(request, { success: false, message: "Could not allocate order number" }, 500); }
    }
    const match = url.pathname.match(/^\/orders\/payment-reference\/([^/]+)\/?$/);
    if (request.method === "GET" && match) {
      const ref = digits(decodeURIComponent(match[1]));
      if (ref.length < 8 || ref.length > 30) return reply(request, { success: false, message: "Invalid payment reference" }, 400);
      try {
        const row = await env.DB.prepare("SELECT order_number FROM orders WHERE upi_reference = ? LIMIT 1").bind(ref).first();
        return reply(request, { success: true, used: !!row, order_no: row?.order_number || null });
      } catch { return reply(request, { success: false, message: "Reference lookup failed" }, 500); }
    }
    if (request.method === "POST" && url.pathname === "/orders/online") {
      if (Number(request.headers.get("Content-Length") || 0) > 65536) return reply(request, { success: false, message: "Order payload too large" }, 413);
      let p;
      try { p = await request.json(); } catch { return reply(request, { success: false, message: "Invalid JSON" }, 400); }
      const orderNo = String(p?.order_no || "").trim().toUpperCase();
      const name = String(p?.customer_name || "").trim().slice(0, 120);
      const phone = digits(p?.customer_phone);
      const type = p?.order_type === "Pickup" || p?.order_type === "Home Delivery" ? p.order_type : "";
      const ref = digits(p?.payment_reference), items = p?.items;
      const food = Number(p?.food_total), discount = Number(p?.discount_amount || 0), delivery = Number(p?.delivery_charges || 0), total = Number(p?.total_amount);
      if (!validOrderNo(orderNo)) return reply(request, { success: false, message: "Invalid order number" }, 400);
      if (!name) return reply(request, { success: false, message: "Customer name is required" }, 400);
      if (!/^\d{10}$/.test(phone)) return reply(request, { success: false, message: "Valid 10-digit mobile number required" }, 400);
      if (!type) return reply(request, { success: false, message: "Invalid order type" }, 400);
      if (!Array.isArray(items) || !items.length || items.length > 100) return reply(request, { success: false, message: "Invalid order items" }, 400);
      const safeItems = [];
      for (const item of items) {
        const itemName = String(item?.name || "").trim().slice(0, 160), price = Number(item?.price), qty = Number(item?.qty ?? 1);
        if (!itemName || !Number.isFinite(price) || price <= 0 || price > 100000 || !Number.isInteger(qty) || qty < 1 || qty > 99) return reply(request, { success: false, message: "Invalid item details" }, 400);
        const canonicalPrice = await getCanonicalMenuPrice(env, itemName);
        if (canonicalPrice === null || canonicalPrice === undefined || Math.abs(price - canonicalPrice) > 0.001) return reply(request, { success: false, message: "Item or price does not match the current menu: " + itemName }, 400);
        safeItems.push({ name: itemName, price: canonicalPrice, qty });
      }
      const calculatedFood = safeItems.reduce((sum, item) => sum + item.price * item.qty, 0);
      if (!Number.isFinite(food) || !Number.isFinite(discount) || !Number.isFinite(delivery) || !Number.isFinite(total) || food <= 0 || discount < 0 || discount > food || delivery < 0 || total <= 0 || Math.abs(calculatedFood - food) > .01 || Math.abs(food - discount + delivery - total) > .01) return reply(request, { success: false, message: "Order total does not match item totals" }, 400);
      if (type === "Pickup" && delivery !== 0) return reply(request, { success: false, message: "Pickup cannot include delivery charges" }, 400);
      if (type !== "Pickup" && discount !== 0) return reply(request, { success: false, message: "Discount is only available for pickup orders" }, 400);
      const discountRate = food > 2500 ? .20 : food > 2000 ? .17 : food > 1500 ? .15 : food > 1100 ? .10 : food > 900 ? .09 : food > 700 ? .07 : food > 500 ? .05 : 0;
      const allowedDiscount = type === "Pickup" ? Math.round(food * discountRate * 100) / 100 : 0;
      if (Math.abs(discount - allowedDiscount) > .01) return reply(request, { success: false, message: "Pickup discount does not match the current offer" }, 400);
      if (type === "Home Delivery") {
        const deliveryPin = Number(String(p?.pincode || ""));
        if (!String(p?.address || "").trim() || !/^\\d{6}$/.test(String(p?.pincode || "")) || deliveryPin < 144001 || deliveryPin > 144030) return reply(request, { success: false, message: "Delivery is available only with an address and pincode 144001–144030" }, 400);
        const expectedDelivery = deliveryPin <= 144015 ? 100 : 200;
        if (Math.abs(delivery - expectedDelivery) > 0.01) return reply(request, { success: false, message: "Delivery charge does not match the serviceable pincode" }, 400);
      }
      if (ref.length < 8 || ref.length > 30) return reply(request, { success: false, message: "Payment reference required" }, 400);
      try {
        const oldOrder = await env.DB.prepare("SELECT order_number, upi_reference FROM orders WHERE order_number = ? LIMIT 1").bind(orderNo).first();
        if (oldOrder) {
          if (oldOrder.upi_reference === ref) return reply(request, { success: true, already_saved: true, order_no: orderNo, message: "Order already archived" });
          return reply(request, { success: false, message: "Order number already exists" }, 409);
        }
        const used = await env.DB.prepare("SELECT order_number FROM orders WHERE upi_reference = ? LIMIT 1").bind(ref).first();
        if (used) return reply(request, { success: false, used: true, order_no: used.order_number, message: "Payment reference already used" }, 409);
        const details = {
          items: safeItems, source: String(p?.source || "ONLINE").slice(0, 30), order_type: type,
          address: type === "Home Delivery" ? String(p?.address || "").trim().slice(0, 500) : null,
          pincode: type === "Home Delivery" ? String(p?.pincode || "") : null,
          food_total: food, discount_amount: discount, delivery_charges: delivery,
          special_instructions: String(p?.special_instructions || "").slice(0, 500),
          screenshot_received: false
        };
        await env.DB.prepare("INSERT INTO orders (order_number, customer_name, mobile, items_json, total_amount, payment_method, upi_reference, payment_status, order_status, payment_screenshot_url) VALUES (?, ?, ?, ?, ?, 'UPI', ?, 'SCREENSHOT_REVIEW_REQUIRED', 'NEW', NULL)").bind(orderNo, name, phone, JSON.stringify(details), total, ref).run();
        return reply(request, { success: true, order_no: orderNo, payment_status: "SCREENSHOT_REVIEW_REQUIRED", message: "Order archived; screenshot is not bank confirmation." }, 201);
      } catch (error) {
        if (/unique constraint failed.*(upi_reference|order_number)/i.test(String(error?.message || ""))) {
          const used = await env.DB.prepare("SELECT order_number FROM orders WHERE upi_reference = ? LIMIT 1").bind(ref).first().catch(() => null);
          return reply(request, { success: false, used: true, order_no: used?.order_number || null, message: "Payment reference already used" }, 409);
        }
        console.error("Order archive failed");
        return reply(request, { success: false, message: "Order could not be archived" }, 500);
      }
    }
    return reply(request, { success: false, message: "Not found" }, 404);
  }
};
