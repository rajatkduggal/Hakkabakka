const CACHE_NAME = "hakkabakka-v36";

const APP_SHELL = [
  "/",
  "/index.html"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const request = event.request;
  const isNavigation = request.mode === "navigate";

  event.respondWith(
    fetch(request)
      .then(response => {
        // Do not let failed responses replace good cached assets.
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copy))
            .catch(() => {});
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        // Only navigations should fall back to the app shell.
        // Returning index.html for an image or JSON/API request can
        // make the browser treat HTML as the requested resource.
        if (isNavigation) {
          const appShell = await caches.match("/index.html");
          if (appShell) return appShell;
        }

        return new Response("Offline and no cached response is available.", {
          status: 503,
          statusText: "Service Unavailable",
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store"
          }
        });
      })
  );
});
