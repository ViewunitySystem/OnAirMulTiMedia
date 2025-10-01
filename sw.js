// OnAirMulTiMedia Service Worker
// Minimaler Service Worker für 404/Offline-Funktionalität

const CACHE_NAME = 'onairmultimedia-v1';
const OFFLINE_URL = '/offline.html';

// Dateien die gecacht werden sollen
const CACHE_URLS = [
  '/',
  '/index.html',
  '/info.html',
  '/offline.html',
  '/assets/cover.jpg',
  '/manifest.json'
];

// Service Worker Installation
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Installation gestartet');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Cache geöffnet');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation abgeschlossen');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker: Installationsfehler', error);
      })
  );
});

// Service Worker Aktivierung
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Aktivierung gestartet');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Alten Cache löschen', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Aktivierung abgeschlossen');
        return self.clients.claim();
      })
  );
});

// Fetch-Events: Netzwerk-First mit Cache-Fallback
self.addEventListener('fetch', event => {
  // Nur GET-Requests behandeln
  if (event.request.method !== 'GET') {
    return;
  }

  // Spezielle Behandlung für verschiedene Dateitypen
  const url = new URL(event.request.url);
  
  // HTML-Dateien: Cache-First für bessere Performance
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            console.log('📄 Service Worker: HTML aus Cache geladen', url.pathname);
            return response;
          }
          
          // Nicht im Cache: Netzwerk versuchen
          return fetch(event.request)
            .then(response => {
              // Erfolgreiche Antwort: Cache aktualisieren
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, responseClone));
              }
              return response;
            })
            .catch(() => {
              // Netzwerk-Fehler: Offline-Seite zeigen
              console.log('🌐 Service Worker: Netzwerk-Fehler, Offline-Seite laden');
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // Statische Assets: Cache-First
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            console.log('📦 Service Worker: Asset aus Cache geladen', url.pathname);
            return response;
          }
          
          return fetch(event.request)
            .then(response => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, responseClone));
              }
              return response;
            });
        })
    );
    return;
  }

  // API-Calls: Netzwerk-First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // API-Antworten nicht cachen
          return response;
        })
        .catch(() => {
          // API-Fehler: 503 Service Unavailable
          return new Response(
            JSON.stringify({ error: 'Service temporarily unavailable' }),
            { 
              status: 503, 
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Alle anderen Requests: Netzwerk-First mit Cache-Fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Erfolgreiche Antwort: Cache aktualisieren
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Netzwerk-Fehler: Cache versuchen
        return caches.match(event.request)
          .then(response => {
            if (response) {
              console.log('📦 Service Worker: Fallback aus Cache', url.pathname);
              return response;
            }
            
            // Nicht im Cache: 404-Seite
            return new Response(
              `<!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <title>404 - Seite nicht gefunden</title>
                <style>
                  body { font-family: system-ui; text-align: center; padding: 2rem; background: #0b0f17; color: #eaf0ff; }
                  h1 { color: #f472b6; }
                  a { color: #7dd3fc; }
                </style>
              </head>
              <body>
                <h1>404 - Seite nicht gefunden</h1>
                <p>Die angeforderte Seite konnte nicht gefunden werden.</p>
                <a href="/">Zur Startseite</a>
              </body>
              </html>`,
              { 
                status: 404, 
                statusText: 'Not Found',
                headers: { 'Content-Type': 'text/html' }
              }
            );
          });
      })
  );
});

// Message-Handler für Kommunikation mit der Hauptseite
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('🔧 Service Worker: Script geladen');
