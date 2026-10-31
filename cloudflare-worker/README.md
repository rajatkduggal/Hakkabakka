# HakkaBakka Cloudflare Orders API

This is the source currently deployed as `hb-orders-api`.

## Required D1 bindings

- `DB` → `hb-orders` (orders, payment references, monthly order counters)
- `MENU_DB` → `hakkabakka-admin` (live published menu and price validation)

The API allocates India-local monthly order numbers, validates every cart item against the currently published and available Admin Panel menu, checks totals and pickup discounts, rejects duplicate UPI references, and stores online orders in D1.

## Endpoints

- `GET /health` — checks both D1 databases and returns the published menu count
- `POST /orders/next-number` — allocates a monthly order number
- `GET /orders/payment-reference/{reference}` — checks whether a UPI reference has already been used
- `POST /orders/online` — validates and stores an online order

## Payment verification

The website performs client-side OCR checks on the uploaded receipt (amount, date, time, order reference, and UPI reference). This is not bank-side confirmation. Staff must confirm the money was actually credited before treating an order as paid. The customer is asked to attach the receipt in WhatsApp; this API does not retain the screenshot file.

Keep both D1 bindings configured. Menu price and availability changes made in the Admin Panel are picked up automatically at checkout.
