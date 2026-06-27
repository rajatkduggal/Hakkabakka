const CACHE_NAME = 'hakkabakka-v4';

// आपके GitHub स्ट्रक्चर के अनुसार सभी मुख्य फाइलों और मेनू इमेजेस की लिस्ट
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './menu.html',
  './manifest.json',
  './app-icon.jpg',
  './logo.jpg',
  './signboard.png',
  
  // मेनू डिशेज की इमेजेस (ताकि बिना इंटरनेट भी मेनू सही से दिखे)
  './images/paneer_tikka.jpg',
  './images/paneer malai tikka.jpg',
  './images/paneer-kali-mirch-tikka.jpg',
  './images/mushroom tikka.jpg',
  './images/soya chaap tikka.jpg',
  './images/soya malai tikka.jpg',
  './images/dal fry.jpg',
  './images/dal makhani.jpg',
  './images/chana masala.jpg',
  './images/paneer butter masala.jpg',
  './images/kadai paneer.jpg',
  './images/shahi paneer.jpg',
  './images/hakka bakka rara paneer.jpg',
  './images/paneer chili.jpg',
  './images/chilli potato.jpg',
  './images/chilli mushroom.jpg',
  './images/french fries.jpg',
  './images/tari wala mutton.jpg',
  './images/tari wala chicken.jpg',
  './images/butter chicken.jpg',
  './images/kadai chicken.jpg',
  './images/chicken curry.jpg',
  './images/chicken masala.jpg',
  './images/plain rice.jpg',
  './images/jeera rice.jpg',
  './images/mix veg rice.jpg',
  './images/tandoori chapati.jpg',
  './images/butter naan.jpg',
  './images/garlic naan.jpg',
  './images/lachha paratha.jpg',
  './images/sweet lassi.jpg',
  './images/water bottle.jpg',
  './images/milkshake.jpg'
];

// Install and Cache Everything Automatically
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Hakka Bakka App: Caching all premium assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate and Clear Old Cache (ताकि पुराना कैश डिलीट हो और नया कोड तुरंत काम करे)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Hakka Bakka App: Clearing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network First with Cache Fallback (इंटरनेट होने पर लाइव डेटा, न होने पर कैश से ऐप खुलेगी)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
