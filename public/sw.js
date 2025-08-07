// Service Worker for caching and performance
const CACHE_NAME = 'weekly-wizdom-v1';
const urlsToCache = [
  '/',
  '/lovable-uploads/97f86327-e463-4091-8474-4f835ee7556f.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});