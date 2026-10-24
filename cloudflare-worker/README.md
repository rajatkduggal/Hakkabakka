# HakkaBakka Cloudflare D1 Orders API

Worker source is in `index.js`. Bind D1 database `hb-orders` to variable `DB`, then deploy the complete Worker source to the existing `hb-orders-api` Worker. Order numbers use `HB-DDMMYYYY-XXXXXXXX` (example: `HB-24102026-A1B2C3D4`). Test `GET /health`.

## Price validation

The Worker now checks each submitted item name and price against the `MENU_PRICES` allowlist embedded in `index.js`. This list was generated from the website menu in the same feature branch at the time of this commit. When menu prices or item names change in `index.html`, update the allowlist and test checkout before deploying. Items with no published price are intentionally not accepted.

## Production safety notes

- Screenshot OCR is not bank confirmation. D1 records payment as `SCREENSHOT_REVIEW_REQUIRED`.
- CORS is not authentication. Configure Turnstile (including server-side token verification) or another suitable abuse control before relying on this public API.
- Screenshot storage is not implemented; the API records metadata only.
- The website can save an order in D1 before Railway POS responds. On a POS failure, the UI now instructs the customer to retry with the same order number and not pay again; reconciliation is still needed for production operations.
- Before production rollout, test a valid order, tampered price, invalid total, duplicate UPI reference, POS failure/retry, and the screenshot workflow in a controlled environment.
