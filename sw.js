// PropertyCam Service Worker v1.0
// Enables "Add to Home Screen" / PWA install on iOS and Android

const CACHE = 'propertycam-v1';
const PRECACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './apple-touch-icon.png',
];

// Install: pre-cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API calls, cache-first for app shell
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Always go to network for Microsoft auth/API and geocoding
  const networkOnly = [
    'microsoftonline.com',
    'graph.microsoft.com',
    'nominatim.openstreetmap.org',
    'alcdn.msauth.net',
  ];

  if (networkOnly.some(h => url.includes(h))) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Cache-first for app shell
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
