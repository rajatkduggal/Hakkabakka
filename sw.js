const CACHE_NAME = "hakkabakka-home-v72";
const APP_SHELL = ["/", "/index.html", "/manifest.json", "/hakkabakka-icon-red.svg?v=4"];

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(error => { console.warn("HakkaBakka app shell cache skipped:", error); })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("hakkabakka-home-") && key !== CACHE_NAME).map(key => caches.delete(key))))
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
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (isNavigation) {
          const shell = await caches.match("/index.html");
          if (shell) return shell;
        }
        return new Response("Offline and no cached response is available.", {
          status: 503,
          statusText: "Service Unavailable",
          headers: {"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}
        });
      })
  );
});
