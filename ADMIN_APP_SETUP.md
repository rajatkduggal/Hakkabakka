# HakkaBakka Admin App — build status and deployment

## Preview
The mobile-first PWA dashboard is at `/admin/`. The prototype has local-only draft saves, a demo menu list, and JSON export helpers. It does not alter the customer website, live menu, cart, payment code, or orders.

## Included in this branch
- `admin/index.html`: mobile-first dashboard for Website/Banner, Menu/Pricing, Orders/Payments, POS/Kitchen, Social, Offers, Security, and integration status.
- `admin/manifest.webmanifest` and `admin/sw.js`: installable PWA shell.
- `admin-api/src/index.js`: Cloudflare Worker API source for password login, server-side sessions, menu CRUD, offers, homepage content and read-only orders list.
- `admin-api/schema.sql`: D1 tables for sessions, menu, offers, homepage content and orders.
- `admin-api/wrangler.toml`: Worker deployment template.

## Important: not production-live yet
This is not yet a complete live production system. The API source is prepared but has not been deployed or security-tested; the D1 database has not been created/bound; no admin password secret is configured; and the static PWA UI is not yet wired to the API. Therefore, don't use this for real orders, live menu changes, payments, or admin credentials yet.

## Secure backend setup (Railway is not used)
1. Create a Cloudflare D1 database named `hakkabakka-admin` in your Cloudflare account.
2. Replace `REPLACE_WITH_D1_DATABASE_ID` in `admin-api/wrangler.toml` with that database ID.
3. Apply `admin-api/schema.sql` to the D1 database using Wrangler.
4. Set a strong secret with `npx wrangler secret put ADMIN_PASSWORD`; do not commit it to GitHub or put it in browser JavaScript.
5. Deploy the Worker using Wrangler and attach the D1 binding named `DB`.
6. Configure the API hostname and restrictive CORS to the admin origin. Use HTTPS.
7. Wire the admin UI to the API and test login/session expiry, invalid credentials, menu CRUD, audit logging, and recovery before live use.

## Security boundary and remaining production work
- Add rate limiting and audit log records for all writes.
- Add session cleanup and CSRF protection suitable to the final origin arrangement.
- Add staff roles only if needed; currently the API assumes one admin secret.
- Payment status must only come from verified payment-provider webhooks/reconciliation, never customer screenshots.
- Orders are read-only in this initial API scaffold. Secure order creation/status transitions and validation are still needed.
- POS/KOT needs the exact printer/browser setup validated; this branch does not print.
- Social posting and Metricool sync require separate API entitlement and credentials, stored server-side.
- Before merging to `main`, complete deployment and security review. The PR is intentionally a draft and does not change the live customer website.
