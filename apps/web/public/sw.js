// Service Worker for CoopSetu AI PWA & Offline Engine
const CACHE_NAME = 'coopsetu-cache-v1';
const OFFLINE_URL = '/my-learning';

const STATIC_PRECACHE = [
  '/',
  '/my-learning',
  '/courses',
  '/manifest.json',
  '/favicon.ico',
];

// Install: Cache critical static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[SW] Failed to precache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy depending on request type
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g. POST to offline sync or clerk)
  if (request.method !== 'GET') {
    return;
  }

  // Ignore external auth providers or backend API posts
  if (url.origin !== self.location.origin && !url.hostname.includes('localhost')) {
    return;
  }

  // API endpoints should never be blindly cached by SW (handled by sync queue / app logic)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 1. Static Next.js assets (_next/static, images, fonts) -> Cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          return new Response('', { status: 404, statusText: 'Not found' });
        });
      })
    );
    return;
  }

  // 2. HTML navigation requests -> Network-first with Cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, update cache
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(async () => {
          // Check if exact page is in cache
          const cachedMatch = await caches.match(request);
          if (cachedMatch) {
            return cachedMatch;
          }
          // If not in cache, fallback to offline learning center
          const fallback = await caches.match(OFFLINE_URL);
          if (fallback) {
            return fallback;
          }
          return new Response('You are offline. Please navigate to /my-learning to access cached materials.', {
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    );
    return;
  }

  // 3. Other requests -> Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Message listener for manual cache triggers from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urlsToCache = event.data.urls || [];
    caches.open(CACHE_NAME).then((cache) => {
      cache.addAll(urlsToCache);
    });
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
