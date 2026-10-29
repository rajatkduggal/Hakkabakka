# HakkaBakka Admin App — build status and deployment

## Preview
The mobile-first PWA dashboard is deployed at `/admin/` on Cloudflare Pages. It calls the Cloudflare Worker API at `https://hakkabakka-admin-api.mail-marvelgroup.workers.dev/api`. Admin menu, offers, homepage content and POS orders use the separate `hakkabakka-admin` D1 database; these changes do not automatically publish to the customer website.

## Included in this branch
- `admin/index.html`: mobile-first dashboard for Website/Banner, Menu/Pricing, Orders/Payments, POS/Kitchen, Social, Offers, Security, and integration status.
- `admin/manifest.webmanifest` and `admin/sw.js`: installable PWA shell.
- `admin-api/src/index.js`: Cloudflare Worker API source for password login, server-side sessions, menu CRUD, offers, homepage content and read-only orders list.
- `admin-api/schema.sql`: D1 tables for sessions, menu, offers, homepage content and orders.
- `admin-api/wrangler.toml`: Worker deployment configuration with the existing D1 database ID.

## Current status (2026-10-29)
The Worker `hakkabakka-admin-api` and D1 database `hakkabakka-admin` are deployed. The `DB` binding and `ADMIN_PASSWORD` secret are present, and the schema has been applied. The Worker health endpoint returns `{\"ok\":true,\"app\":\"HakkaBakka Admin API\",\"mode\":\"protected\"}`. A CORS fix was deployed to allow HTTPS preview URLs belonging to this exact Cloudflare Pages project. End-to-end browser login and all admin workflows still require live verification. This is not yet a fully production-validated system; do not treat admin payment status as a payment-provider verification.

## Secure backend setup (Railway is not used)
The current D1 database ID is recorded in `admin-api/wrangler.toml`. The database schema and `DB` binding have been applied in Cloudflare. `ADMIN_PASSWORD` is configured as a Cloudflare secret and must not be committed to GitHub or put in browser JavaScript. To redeploy after code changes, deploy the Worker with Wrangler and preserve the existing secret and D1 binding. Test login/session expiry, invalid credentials, menu CRUD, order read/write behavior, CORS, and recovery before live use.

## Security boundary and remaining production work
- Add rate limiting and audit log records for all writes.
- Add session cleanup and CSRF protection suitable to the final origin arrangement.
- Add staff roles only if needed; currently the API assumes one admin secret.
- Payment status must only come from verified payment-provider webhooks/reconciliation, never customer screenshots.
- Orders are read-only in this initial API scaffold. Secure order creation/status transitions and validation are still needed.
- POS/KOT needs the exact printer/browser setup validated; this branch does not print.
- Social posting and Metricool sync require separate API entitlement and credentials, stored server-side.
- Before merging to `main`, complete deployment and security review. The PR is intentionally a draft and does not change the live customer website.
