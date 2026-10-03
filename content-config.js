/*
 * Public, non-secret runtime settings for the homepage content adapter.
 * Point feedUrl at a same-origin server endpoint when the official Meta
 * integration is deployed. Never put an Instagram token or client secret here.
 */
window.HAKKABAKKA_CONTENT_CONFIG = Object.freeze({
  feedUrl: './content-feed.json',
  instagramProfileUrl: 'https://www.instagram.com/hakka_bakka.in/',
  cacheKey: 'hb_home_content_v1',
  cacheTtlMs: 15 * 60 * 1000,
  requestTimeoutMs: 3500
});
