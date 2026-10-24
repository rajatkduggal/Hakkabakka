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
const validOrderNo = value => typeof value === "string" && /^HB-\d{8}-[A-Z0-9]{8}$/.test(value); // HB-DDMMYYYY-XXXXXXXX
// Server-side price allowlist generated from the website menu at this commit. Keep in sync with index.html.
const MENU_PRICES = {
  "Paneer Tikka": 280,
  "Paneer Malai Tikka": 300,
  "Paneer Kali Mirch Tikka": 300,
  "Mushroom Tikka": 250,
  "Soya Chaap Tikka": 220,
  "Soya Malai Tikka": 250,
  "Soya Hariyali Tikka": 240,
  "Plain Rice": 100,
  "Jeera Rice": 150,
  "Mix Veg Rice": 190,
  "Dal Fry": 200,
  "Dal Makhani": 250,
  "Chana Masala": 200,
  "Paneer Butter Masala": 270,
  "Cheese Tomato": 260,
  "Mushroom Do Pyaza": 250,
  "Kadai Paneer": 250,
  "Mix Veg": 200,
  "Paneer Do Pyaza": 250,
  "Mushroom Masala": 200,
  "Hakka Bakka Spl. Champ": 250,
  "Shahi Paneer": 250,
  "Paneer Bhurji": 200,
  "Paneer Kali Mirch": 250,
  "Hakka Bakka Spl. Rara Paneer": 300,
  "Paneer Chilli": 250,
  "Chilli Potato": 200,
  "French Fries": 150,
  "French Fries Peri Peri": 200,
  "Chilli Mushroom": 200,
  "Paneer Fingers": 250,
  "Honey Chilli Potato": 220,
  "Veg Manchurian (Gravy/Dry)": 200,
  "Schezwan Fried Noodles": 250,
  "Veg Spring Rolls (6 Pcs.)": 180,
  "Unlimited Thali": 200,
  "Sweet Lassi": 80,
  "Masala Chach": 80,
  "Lemon Ice Tea": 100,
  "Shakes (Any Flavour)": 150,
  "Mojito": 100,
  "Cold Coffee": 100,
  "Ice Cream": 100,
  "Tandoori Roti": 13,
  "Butter Roti": 18,
  "Missi Roti": 35,
  "Plain Naan": 50,
  "Butter Naan": 75,
  "Garlic Naan": 85,
  "Lachha Paratha": 60,
  "Pudina Paratha": 65,
  "Green Chilli Paratha": 65,
  "Red Chilli Paratha": 65,
  "Amritsari Kulcha with Chana (1 Pc.)": 100,
  "Masala Papad": 90,
  "Peanut Masala": 100,
  "Cream Cucumber Salad": 100,
  "Chana Chaat": 100,
  "Green Salad": 80,
  "Extra Onion": 30,
  "Boondi Raita": 80,
  "Mix Raita": 100,
  "Aloo Raita": 90,
  "Tari Wala Chicken - 2 Pcs.": 200,
  "Tari Wala Chicken - Half": 400,
  "Tari Wala Chicken - Full": 650,
  "Tari Wala Mutton - 2 Pcs.": 300,
  "Tari Wala Mutton - Half": 400,
  "Tari Wala Mutton - Full": 650,
  "Tandoori Chicken - Half": 290,
  "Tandoori Chicken - Full": 500,
  "Irani Chicken - Half": 330,
  "Irani Chicken - Full": 550,
  "Afghani Chicken - Half": 330,
  "Afghani Chicken - Full": 550,
  "Chicken Tikka - Half": 330,
  "Chicken Tikka - Full": 500,
  "Lasuni Chicken Tikka - Half": 350,
  "Lasuni Chicken Tikka - Full": 600,
  "Chicken Malai Tikka - Half": 350,
  "Chicken Malai Tikka - Full": 600,
  "Chicken Seekh Kebab": 250,
  "Mutton Seekh Kebab": 350,
  "Chicken Afghani Tikka": 350,
  "Chilli Chicken": 350,
  "Chilli Chicken Boneless": 400,
  "KFC Chicken": 350,
  "Fried Chicken": 300,
  "Chicken Rice": 250,
  "Mutton Rice": 350,
  "Mutton Rogan Josh - Half": 400,
  "Mutton Rogan Josh - Full": 650,
  "Dahi Chicken - Half": 300,
  "Dahi Chicken - Full": 500,
  "Butter Chicken - Half": 350,
  "Butter Chicken - Full": 600,
  "Kadhai Chicken - Half": 350,
  "Kadhai Chicken - Full": 600,
  "Tawa Chicken - Half": 300,
  "Tawa Chicken - Full": 550,
  "Rara Chicken - Half": 350,
  "Rara Chicken - Full": 600,
  "Chicken Curry - Half": 300,
  "Chicken Curry - Full": 550,
  "Chicken Masala - Half": 300,
  "Chicken Masala - Full": 550,
  "Chicken Malai Tikka Masala - Half": 350,
  "Chicken Malai Tikka Masala - Full": 550,
  "Chicken Keema Masala - Half": 360,
  "Chicken Keema Masala - Full": 600,
  "Cream Kali Mirch Chicken - Half": 350,
  "Cream Kali Mirch Chicken - Full": 650,
  "Palak Chicken - Half": 300,
  "Palak Chicken - Full": 550,
  "Fried Chicken - Half": 280,
  "Fried Chicken - Full": 500,
  "Chicken Fry KFC - Half": 300,
  "Chicken Fry KFC - Full": 500,
  "Chilli Chicken - Half": 300,
  "Chilli Chicken - Full": 550,
  "Chilli Chicken Boneless - Half": 350,
  "Chilli Chicken Boneless - Full": 650,
  "Lemon Chicken - Half": 290,
  "Lemon Chicken - Full": 550,
  "Garlic Chicken - Half": 290,
  "Garlic Chicken - Full": 550,
  "Egg Omelette": 100,
  "Egg Bhurji": 150,
  "Egg Curry": 250
};

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
        const canonicalPrice = MENU_PRICES[itemName];
        if (canonicalPrice === undefined || Math.abs(price - canonicalPrice) > 0.001) return reply(request, { success: false, message: "Item or price does not match the current menu: " + itemName }, 400);
        safeItems.push({ name: itemName, price: canonicalPrice, qty });
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
