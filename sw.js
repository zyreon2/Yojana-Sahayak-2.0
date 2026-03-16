/* ─── ArogyaCode Service Worker ─────────────────── */
const CACHE = 'arogyacode-v1';

// Files to cache for offline use
const PRECACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// ── Install: cache all core files ────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: serve from cache, fall back to network ─
self.addEventListener('fetch', event => {
  // Never intercept Supabase API calls — always go live for data
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache successful GET requests
        if (
          event.request.method === 'GET' &&
          response &&
          response.status === 200
        ) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If offline and not in cache, show the app shell
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
