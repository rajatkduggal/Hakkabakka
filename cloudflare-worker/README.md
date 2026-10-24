# HakkaBakka Cloudflare D1 Orders API

Worker source is in index.js. Bind D1 database hb-orders to variable DB, then paste index.js into the existing hb-orders-api Worker editor and deploy. Test GET /health.

Security note: screenshot OCR is not bank confirmation. This archive stores payment_status SCREENSHOT_REVIEW_REQUIRED. CORS is not authentication; add Turnstile or equivalent abuse control before relying on this as a hardened public API.