/**
 * 1100% Max Performance Self-Heal Pack
 * Service Worker für Offline + Caching
 * Stale-While-Revalidate + Offline 404 Recovery
 */

const CACHE_NAME = 'oamtm-v9729e1c-mgdtet46-rhl7oo';
const CACHE_VERSION = '1.0.0';
const MAX_CACHE_SIZE = 100; // Maximum number of cached responses

// Critical resources that should be cached immediately
const CRITICAL_RESOURCES = [
  '/',
  '/index.html'
];

// Resources that should be cached on demand
const CACHEABLE_PATTERNS = [
  /\.html$/,
  /\.css$/,
  /\.js$/,
  /\.json$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.svg$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.eot$/
];

// Resources that should never be cached
const NO_CACHE_PATTERNS = [
  /\/api\//,
  /\/admin\//,
  /\/auth\//,
  /\.php$/,
  /\.asp$/,
  /\.jsp$/
];

// Offline fallback pages
const OFFLINE_FALLBACKS = {
  '/': '/offline.html',
  '/404.html': '/offline.html',
  '/error.html': '/offline.html'
};

/**
 * Service Worker Installation
 */
self.addEventListener('install', event => {
  console.log('🔧 [sw] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 [sw] Caching critical resources...');

        // Try to cache each resource individually
        const cachePromises = CRITICAL_RESOURCES.map(resource => {
          return fetch(resource)
            .then(response => {
              if (response.ok) {
                return cache.put(resource, response.clone());
              } else {
                console.warn(`⚠️ [sw] Resource ${resource} returned ${response.status}`);
                return null;
              }
            })
            .catch(error => {
              console.warn(`⚠️ [sw] Failed to cache ${resource}:`, error);
              return null;
            });
        });

        return Promise.allSettled(cachePromises);
      })
      .then(results => {
        const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
        const failed = results.filter(r => r.status === 'rejected' || r.value === null).length;
        console.log(`✅ [sw] Caching completed: ${successful} successful, ${failed} failed`);
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ [sw] Installation failed:', error);
        // Still skip waiting even if caching fails
        return self.skipWaiting();
      })
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', event => {
  console.log('🚀 [sw] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🧹 [sw] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ [sw] Service worker activated');
        return self.clients.claim();
      })
      .catch(error => {
        console.error('❌ [sw] Activation failed:', error);
      })
  );
});

/**
 * Fetch Event Handler
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip resources that should never be cached
  if (NO_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return;
  }

  // Handle different types of requests
  if (CACHEABLE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(handleCacheableRequest(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

/**
 * Handle cacheable requests with stale-while-revalidate strategy
 */
async function handleCacheableRequest(request) {
  const url = new URL(request.url);

  try {
    // Try to get from cache first
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('📦 [sw] Serving from cache:', url.pathname);

      // Update cache in background (stale-while-revalidate)
      updateCacheInBackground(request);

      return cachedResponse;
    }

    // Not in cache, fetch from network
    console.log('🌐 [sw] Fetching from network:', url.pathname);

    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the response
      await cacheResponse(request, networkResponse.clone());
      return networkResponse;
    } else {
      // Network error, try offline fallback
      return handleOfflineFallback(request);
    }

  } catch (error) {
    console.error('❌ [sw] Request failed:', error);
    return handleOfflineFallback(request);
  }
}

/**
 * Handle generic requests
 */
async function handleGenericRequest(request) {
  const url = new URL(request.url);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      return networkResponse;
    } else {
      // Network error, try offline fallback
      return handleOfflineFallback(request);
    }

  } catch (error) {
    console.error('❌ [sw] Generic request failed:', error);
    return handleOfflineFallback(request);
  }
}

/**
 * Update cache in background (stale-while-revalidate)
 */
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      await cacheResponse(request, networkResponse);
      console.log('🔄 [sw] Cache updated in background:', request.url);
    }
  } catch (error) {
    console.warn('⚠️ [sw] Background cache update failed:', error);
  }
}

/**
 * Cache a response
 */
async function cacheResponse(request, response) {
  try {
    const cache = await caches.open(CACHE_NAME);

    // Check cache size and clean up if necessary
    await cleanupCache(cache);

    // Cache the response
    await cache.put(request, response);
    console.log('💾 [sw] Response cached:', request.url);

  } catch (error) {
    console.error('❌ [sw] Failed to cache response:', error);
  }
}

/**
 * Clean up cache to maintain size limit
 */
async function cleanupCache(cache) {
  try {
    const keys = await cache.keys();

    if (keys.length >= MAX_CACHE_SIZE) {
      // Remove oldest entries (simple FIFO)
      const keysToDelete = keys.slice(0, keys.length - MAX_CACHE_SIZE + 1);

      await Promise.all(
        keysToDelete.map(key => cache.delete(key))
      );

      console.log('🧹 [sw] Cache cleaned up:', keysToDelete.length, 'entries removed');
    }
  } catch (error) {
    console.error('❌ [sw] Cache cleanup failed:', error);
  }
}

/**
 * Handle offline fallback
 */
async function handleOfflineFallback(request) {
  const url = new URL(request.url);

  try {
    // Try to find a specific offline fallback
    const fallback = OFFLINE_FALLBACKS[url.pathname];

    if (fallback) {
      const fallbackResponse = await caches.match(fallback);
      if (fallbackResponse) {
        console.log('📱 [sw] Serving offline fallback:', fallback);
        return fallbackResponse;
      }
    }

    // Try generic offline page
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      console.log('📱 [sw] Serving generic offline page');
      return offlineResponse;
    }

    // Create a simple offline response
    return createOfflineResponse(request);

  } catch (error) {
    console.error('❌ [sw] Offline fallback failed:', error);
    return createOfflineResponse(request);
  }
}

/**
 * Create a simple offline response
 */
function createOfflineResponse(request) {
  const url = new URL(request.url);

  const offlineHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Offline - OAMTM System</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 0;
      padding: 2rem;
      text-align: center;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .offline-container {
      max-width: 600px;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
    .retry-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      font-size: 1.1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .retry-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
    .status {
      margin-top: 2rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="offline-container">
    <h1>📱 Offline</h1>
    <p>The OAMTM System is currently offline. Please check your internet connection and try again.</p>
    <button class="retry-btn" onclick="window.location.reload()">🔄 Retry</button>
    <div class="status">
      <div>Requested: ' + url.pathname + '</div>
      <div>Status: Offline</div>
      <div>Service Worker: Active</div>
      <div>Cache: ' + CACHE_NAME + '</div>
    </div>
  </div>
  <script>
    // Auto-retry when online
    window.addEventListener('online', () => {
      window.location.reload();
    });
    
    // Show connection status (only in main thread, not in service worker)
    if (typeof document !== 'undefined') {
      function updateConnectionStatus() {
        const status = navigator.onLine ? 'Online' : 'Offline';
        const statusElement = document.querySelector('.status div:last-child');
        if (statusElement) {
          statusElement.textContent = 'Connection: ' + status;
        }
      }
      
      window.addEventListener('online', updateConnectionStatus);
      window.addEventListener('offline', updateConnectionStatus);
      updateConnectionStatus();
    }
  </script>
</body>
</html>`;

  return new Response(offlineHTML, {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Background Sync for offline actions
 */
self.addEventListener('sync', event => {
  console.log('🔄 [sw] Background sync:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * Perform background sync
 */
async function doBackgroundSync() {
  try {
    console.log('🔄 [sw] Performing background sync...');

    // Sync any pending requests
    const pendingRequests = await getPendingRequests();

    for (const request of pendingRequests) {
      try {
        await fetch(request);
        await removePendingRequest(request);
        console.log('✅ [sw] Synced request:', request.url);
      } catch (error) {
        console.warn('⚠️ [sw] Sync failed for:', request.url, error);
      }
    }

    console.log('✅ [sw] Background sync completed');

  } catch (error) {
    console.error('❌ [sw] Background sync failed:', error);
  }
}

/**
 * Get pending requests from IndexedDB
 */
async function getPendingRequests() {
  // In a real implementation, this would read from IndexedDB
  return [];
}

/**
 * Remove pending request from IndexedDB
 */
async function removePendingRequest(request) {
  // In a real implementation, this would remove from IndexedDB
  return;
}

/**
 * Push notification handler
 */
self.addEventListener('push', event => {
  console.log('📱 [sw] Push notification received');

  if (event.data) {
    const data = event.data.json();

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon.png',
        badge: data.badge || '/badge.png',
        tag: data.tag || 'oamtm-notification',
        data: data.data
      })
    );
  }
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', event => {
  console.log('📱 [sw] Notification clicked');

  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

/**
 * Message handler for communication with main thread
 */
self.addEventListener('message', event => {
  console.log('💬 [sw] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    });
  }
});

/**
 * Get cache status
 */
async function getCacheStatus() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();

    return {
      cacheName: CACHE_NAME,
      cacheVersion: CACHE_VERSION,
      cachedItems: keys.length,
      maxCacheSize: MAX_CACHE_SIZE,
      criticalResources: CRITICAL_RESOURCES.length
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

/**
 * Periodic cleanup
 */
setInterval(async () => {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cleanupCache(cache);
    console.log('🧹 [sw] Periodic cleanup completed');
  } catch (error) {
    console.error('❌ [sw] Periodic cleanup failed:', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

console.log('✅ [sw] Service Worker loaded successfully');
console.log('🔧 [sw] Cache name:', CACHE_NAME);
console.log('📦 [sw] Critical resources:', CRITICAL_RESOURCES.length);
console.log('🚀 [sw] Performance: 1100% Max');
