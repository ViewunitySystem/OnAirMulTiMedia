// public/sw.js
const OFFLINE_URL = '/offline.html';
const CACHE_NAME = 'oamtm-shell-v1';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.add(new Request(OFFLINE_URL, {cache: 'reload'}));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => { await clients.claim(); })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const isNav = req.mode === 'navigate';
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      // 404 -> Offline‑Shell zeigen (nur für Navigationen)
      if (isNav && res && res.status === 404) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(OFFLINE_URL)) || res;
      }
      return res;
    } catch (err) {
      if (isNav) {
        const cache = await caches.open(CACHE_NAME);
        const fallback = await cache.match(OFFLINE_URL);
        if (fallback) return fallback;
        return new Response('<h1>Offline</h1>', { headers: {'Content-Type':'text/html'} });
      }
      throw err;
    }
  })());
});
