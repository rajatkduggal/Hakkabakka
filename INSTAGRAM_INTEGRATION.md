# Instagram and homepage content integration

## Current status

The homepage has a safe, API-ready content adapter. It loads `content-feed.json` asynchronously, caches successful approved content in the browser for 15 minutes, and displays existing HakkaBakka food photography whenever no approved live posts are available. The section is intentionally **not** presented as a live Instagram feed until a server-side integration returns approved posts.

`content-feed.json` is checked in with empty collections, so it does not fabricate posts, offers, specials, reels, or announcements.

## Recommended production architecture

Use the official Meta Instagram Graph API through a server-side endpoint or serverless function:

```text
Meta / Instagram Graph API
  -> server-side endpoint (stores token and account ID)
  -> same-origin /api/home-content response
  -> content-feed.js adapter on the website
```

The endpoint should fetch and normalize only approved media, then return a JSON document shaped like `content-feed.json`. Cache the Meta response on the server (for example, 15–60 minutes) and return a short browser cache header. This prevents a Meta API request for every visitor or interaction.

For a static-only deployment, a scheduled workflow may update `content-feed.json` only after a human approval step. It must not publish generated offers, change menu prices, or change restaurant contact details.

## Required server-side configuration

For an Instagram professional account connected to a Facebook Page, configure these **server-only** variables in the hosting provider's secret manager:

- `INSTAGRAM_ACCESS_TOKEN` — a valid Instagram Graph API token.
- `INSTAGRAM_ACCOUNT_ID` — the connected Instagram professional account ID.

Depending on the chosen OAuth/token-refresh implementation, Meta app credentials are also needed server-side. Do not expose them to the browser and do not commit an `.env` file.

Once the endpoint exists, change only the public `feedUrl` in `content-config.js` to its same-origin URL (for example `/api/home-content`). No token belongs in `content-config.js`, `content-feed.js`, HTML, or a public GitHub secret.

## Response contract

```json
{
  "latestPosts": [
    {
      "image": "https://...",
      "permalink": "https://www.instagram.com/p/.../",
      "mediaType": "IMAGE",
      "caption": "Approved caption excerpt",
      "timestamp": "2026-10-03T10:00:00Z",
      "alt": "Optional accessible description"
    }
  ],
  "todaysSpecial": null,
  "chefSpecial": null,
  "offers": [],
  "announcements": [],
  "reels": []
}
```

The client accepts only HTTPS Instagram permalinks and HTTPS image URLs for live post cards. If the request fails, is slow, or supplies no valid approved posts, it keeps the homepage usable with the local fallback cards and the real profile link: <https://www.instagram.com/hakka_bakka.in/>.
