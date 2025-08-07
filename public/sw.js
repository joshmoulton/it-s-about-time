// Enhanced Service Worker for Performance
const CACHE_NAME = 'weekly-wizdom-v3';
const STATIC_CACHE = 'static-v3';
const DYNAMIC_CACHE = 'dynamic-v3';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
  '/lovable-uploads/97f86327-e463-4091-8474-4f835ee7556f.png'
];

// Static assets with long cache
const STATIC_ASSETS = [
  '/lovable-uploads/a8eaa39b-22e5-4a3c-a288-fe43b8619eab.png',
  '/lovable-uploads/473aed7c-96ca-4f8c-a333-ae6069ad51a7.png',
  '/lovable-uploads/e64c88c4-9e6a-42f0-ad0b-898db7fff778.png'
];

// Install: Cache critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(CRITICAL_RESOURCES)),
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
    ]).then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (!name.includes('v3')) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Smart caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle different resource types
  if (url.origin === location.origin) {
    // Local resources: cache first
    event.respondWith(cacheFirst(request));
  } else if (url.hostname.includes('supabase.co')) {
    // API: network first with cache fallback
    event.respondWith(networkFirst(request));
  } else if (url.hostname.includes('fonts.g') || url.hostname.includes('ytimg.com')) {
    // Fonts/Images: cache first with long TTL
    event.respondWith(cacheFirst(request, 86400000)); // 24h
  } else if (url.hostname.includes('youtube')) {
    // YouTube: bypass cache (always fresh)
    return;
  } else {
    // Others: stale while revalidate
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache first strategy
async function cacheFirst(request, maxAge = 3600000) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    const age = Date.now() - new Date(cached.headers.get('date')).getTime();
    if (age < maxAge) return cached;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return cached || new Response('Offline', { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(DYNAMIC_CACHE);
    return await cache.match(request) || new Response('Offline', { status: 503 });
  }
}

// Stale while revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}