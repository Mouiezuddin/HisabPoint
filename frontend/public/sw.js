/**
 * HisabPoint Production Progressive Web App (PWA) Service Worker
 * 
 * Strategy:
 * 1. App Shell & Static Assets: Stale-While-Revalidate / Cache-First for instant loads.
 * 2. Navigation: Network-First with App Shell fallback when offline.
 * 3. SECURITY RULE: NEVER cache /api/ responses. All financial & customer transactions
 *    bypass this cache completely to preserve data integrity and privacy.
 */

const CACHE_VERSION = 'v1.3.0';
const STATIC_CACHE = `hisabpoint-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `hisabpoint-runtime-${CACHE_VERSION}`;

// Core static assets required for the app shell to render offline
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable.png',
  '/apple-touch-icon.png',
  '/logo.webp',
  '/logo-mark.webp'
];

// Install: Pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS);
    })
  );
  // Do not automatically call skipWaiting() here so we don't disrupt active transactions
});

// Activate: Clean up obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('hisabpoint-') && name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for explicit update message from application UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Interceptor
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. STRICT SECURITY: Do NOT intercept or cache any backend API or non-GET requests
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('onrender.com') ||
    url.hostname.includes('neon.tech')
  ) {
    return; // Let browser handle normally over network
  }

  // 2. Navigation requests (HTML pages): Network-First, fallback to cached App Shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 3. Static assets (Vite assets, CSS, JS, Fonts, Images): Cache-First with Network fallback
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
     url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff2?|ttf|ico)$/));

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached and update cache in background (Stale-While-Revalidate)
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {/* Offline, ignore */});

          return cachedResponse;
        }

        // Not in cache, fetch from network and cache
        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const clone = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return networkResponse;
        });
      })
    );
  }
});
