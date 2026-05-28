const CACHE_NAME = 'hakkabakka-v1';
const ASSETS = [
  'index.html',
  'manifest.json',
  'logo.jpg',
  'pizza.png',
  'cheeschilli.png',
  'hnychlyptato.png',
  'nudels.png',
  'momos.png',
  'fries.png',
  'springroll.png',
  'pasta.png',
  'waffle.png',
  'tandoorichicken.png',
  'roganjosh.png',
  'tandoorickntikka.png',
  'kabab.png',
  'tandoorimutton.png',
  'muttoncurry.png',
  'panipuri.png',
  'bhallachat.png',
  'tikkichat.png',
  'dosa.png',
  'idli.png',
  'kulhadtea.png',
  'kulhadcofee.png',
  'coffee.png',
  'couplecoffee.png',
  'sweetlassi.png',
  'chach.png',
  'mojitoo.png',
  'coffeeshake.png',
  'cold_drink.png',
  'water.png'
];

// Install Service Worker
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Cache Data (Offline Sync)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});

