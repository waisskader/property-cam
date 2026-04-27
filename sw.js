// PropertyCam Service Worker v6.0
// Enables "Add to Home Screen" / PWA install on iOS and Android

const CACHE = 'propertycam-v6';
const PRECACHE = [
  './manifest.json',
  './icon-192.png',
  './apple-touch-icon.png',
];

// Install: pre-cache static assets (NOT index.html — keep it network-first)h
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

// Fetch handler
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Always go to network for Microsoft auth/API and geocoding
  const networkOnly = [
    'microsoftonline.com',
    'graph.microsoft.com',
    'nominatim.openstreetmap.org',
    'cdn.jsdelivr.net',
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

  // Network-first for HTML pages — always get the freshest version
  if (url.endsWith('/') || url.includes('index.html') || url.includes('installer.html') || url === self.registration.scope) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for other static assets (icons, manifest)
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
