# HakkaBakka Admin App — safe prototype

## Preview
After this branch is published through GitHub Pages, open `/admin/` on the same site and use the browser's **Add to Home screen / Install app** option.

## Current scope
This is a mobile-first installable PWA shell on a separate `/admin/` path. It does not modify the existing customer website, menu, cart, payment code, or live orders. Local draft buttons only save draft text to the current device. No data is published and no real payment/order actions are performed.

## Security boundary
This is **not production-secure admin access yet**. Do not add a password to frontend HTML or store credentials in localStorage. A static GitHub Pages site cannot protect admin data or safely hold API tokens. Before real use, add server-side authentication and authorization, secure session cookies, audit logs, rate limiting, and server-side validation.

## Recommended production architecture (Railway not used)
- **Frontend/PWA:** existing GitHub Pages domain, isolated under `/admin/`.
- **Backend/API:** Cloudflare Workers with server-side authentication and protected secrets.
- **Data:** Cloudflare D1 for menu, offers, orders, staff roles, and audit history.
- **Image uploads:** Cloudflare R2 with content type/size validation.
- **Payments:** verified provider webhook and server-side transaction verification; never trust screenshots alone.
- **POS/KOT:** authenticated API, order state machine, and printer support validated against the actual device.
- **Social:** manual website-feed editor first. Metricool API sync only after API entitlement and credentials are configured; tokens remain server-side.

## Production implementation order
1. Verify this prototype in preview without changing main.
2. Add secure backend and login before exposing management data.
3. Add menu/offers and banner publishing with version history and rollback.
4. Connect order intake and payment verification.
5. Add POS/KOT after confirming printer/browser requirements.
6. Add social publishing and optional scheduled sync.

## Publish safely
The prototype is on branch `feature/hakkabakka-admin-pwa`. Review the proposed changes and merge only after approval. It has intentionally not been merged to `main`.
