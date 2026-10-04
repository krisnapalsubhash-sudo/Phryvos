// Phryvos PWA Service Worker
// Caching strategies for offline-first experience

const CACHE_NAME = 'phryvos-v1';
const STATIC_CACHE = 'phryvos-static-v1';
const API_CACHE = 'phryvos-api-v1';
const IMAGE_CACHE = 'phryvos-images-v1';

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/radar',
  '/feed',
  '/chat',
  '/profile/me',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
  '/offline.html',
];

// API endpoints that can be cached with stale-while-revalidate
const CACHEABLE_API_PATTERNS = [
  /^\/api\/posts/,
  /^\/api\/stories/,
  /^\/api\/users\/[^/]+\/posts/,
  /^\/api\/connections/,
  /^\/api\/search\/users/,
];

// API endpoints that should NEVER be cached (private data)
const NEVER_CACHE_PATTERNS = [
  /^\/api\/auth/,
  /^\/api\/me\/profile/,
  /^\/api\/conversations/,
  /^\/api\/message-requests/,
  /^\/api\/notifications/,
  /^\/api\/realtime/,
];

// Check if a URL should be cached
function shouldCacheApi(url) {
  const pathname = new URL(url).pathname;

  // Never cache these patterns
  for (const pattern of NEVER_CACHE_PATTERNS) {
    if (pattern.test(pathname)) return false;
  }

  // Cache these patterns with stale-while-revalidate
  for (const pattern of CACHEABLE_API_PATTERNS) {
    if (pattern.test(pathname)) return true;
  }

  return false;
}

// Check if request is for static assets
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff|woff2|ico)$/)
  );
}

// Check if request is navigation
function isNavigation(request) {
  return request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { credentials: 'same-origin' })));
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE && name !== IMAGE_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - handle all requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except for known CDNs)
  if (url.origin !== location.origin) {
    // Allow caching of fonts and common CDNs
    if (!url.hostname.match(/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)/)) {
      return;
    }
  }

  // Static assets: Cache First
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // API requests: Network First with stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    if (shouldCacheApi(request.url)) {
      event.respondWith(networkFirstStaleWhileRevalidate(request, API_CACHE));
    } else {
      // Private data: Network Only
      event.respondWith(networkOnly(request));
    }
    return;
  }

  // Navigation: Network First with offline fallback
  if (isNavigation(request)) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Images: Cache First with network fallback
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Default: Network First
  event.respondWith(networkFirst(request));
});

// Cache First strategy - for static assets and images
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline page for navigation, or error for others
    if (isNavigation(request)) {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

// Network First strategy - for general requests
async function networkFirst(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Network First with stale-while-revalidate - for cacheable APIs
async function networkFirstStaleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);

  // Try network first
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Network failed, try cache
    const cached = await cache.match(request);
    if (cached) {
      // Serve stale content, update in background
      updateCacheInBackground(request, cache);
      return cached;
    }
    throw error;
  }
}

// Network First with offline fallback page
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Try cache
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    // Return offline page
    return caches.match('/offline.html');
  }
}

// Network Only - for private data
async function networkOnly(request) {
  return fetch(request);
}

// Background cache update
async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
  } catch (error) {
    // Ignore background update failures
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'getVersion') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  if (event.data === 'clearCache') {
    caches.keys().then((names) => {
      Promise.all(names.map((name) => caches.delete(name))).then(() => {
        event.ports[0].postMessage({ success: true });
      });
    });
  }
});

// Periodic background sync for queued mutations (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(syncQueuedMutations());
  }
});

// Placeholder for background sync of queued mutations
async function syncQueuedMutations() {
  // This would read from IndexedDB and replay failed requests
  // Implementation depends on the queue structure in the main app
  console.log('[SW] Background sync triggered');
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});

console.log('[SW] Phryvos Service Worker loaded');