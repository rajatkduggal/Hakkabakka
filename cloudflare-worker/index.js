const ALLOWED_ORIGINS = new Set(["https://hakkabakka.in", "https://www.hakkabakka.in"]);
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
const validOrderNo = value => typeof value === "string" && value.length >= 3 && value.length <= 64 && /^[A-Z0-9-]+$/.test(value);
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
        return reply(request, { success: true, service: "hb-orders-api", database: "connected", count: Number(row?.count || 0) });
      } catch { return reply(request, { success: false, message: "Database check failed" }, 500); }
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
      const food = Number(p?.food_total), delivery = Number(p?.delivery_charges || 0), total = Number(p?.total_amount);
      if (!validOrderNo(orderNo)) return reply(request, { success: false, message: "Invalid order number" }, 400);
      if (!name) return reply(request, { success: false, message: "Customer name is required" }, 400);
      if (!/^\d{10}$/.test(phone)) return reply(request, { success: false, message: "Valid 10-digit mobile number required" }, 400);
      if (!type) return reply(request, { success: false, message: "Invalid order type" }, 400);
      if (!Array.isArray(items) || !items.length || items.length > 100) return reply(request, { success: false, message: "Invalid order items" }, 400);
      const safeItems = [];
      for (const item of items) {
        const itemName = String(item?.name || "").trim().slice(0, 160), price = Number(item?.price), qty = Number(item?.qty ?? 1);
        if (!itemName || !Number.isFinite(price) || price <= 0 || price > 100000 || !Number.isInteger(qty) || qty < 1 || qty > 99) return reply(request, { success: false, message: "Invalid item details" }, 400);
        safeItems.push({ name: itemName, price, qty });
      }
      const calculatedFood = safeItems.reduce((sum, item) => sum + item.price * item.qty, 0);
      if (!Number.isFinite(food) || !Number.isFinite(delivery) || !Number.isFinite(total) || food <= 0 || delivery < 0 || total <= 0 || Math.abs(calculatedFood - food) > .01 || Math.abs(food + delivery - total) > .01) return reply(request, { success: false, message: "Order total does not match item totals" }, 400);
      if (type === "Pickup" && delivery !== 0) return reply(request, { success: false, message: "Pickup cannot include delivery charges" }, 400);
      if (type === "Home Delivery" && (!String(p?.address || "").trim() || !/^\d{6}$/.test(String(p?.pincode || "")))) return reply(request, { success: false, message: "Delivery address and 6-digit pincode required" }, 400);
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
          food_total: food, delivery_charges: delivery,
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
