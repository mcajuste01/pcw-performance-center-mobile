const CACHE_VERSION = 'v2-pcw-academy';
const CACHE_NAMES = {
  CORE: `${CACHE_VERSION}-core`,
  DYNAMIC: `${CACHE_VERSION}-dynamic`,
  TRAINING: `${CACHE_VERSION}-training`,
  NOTES: `${CACHE_VERSION}-notes`,
};

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.CORE).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/offline.html',
      ]);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - offline-first with intelligent caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip non-HTTP(S)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Never intercept or cache Vite dev server / HMR / source-module assets.
  // Serving a stale cached copy of these in dev loads a duplicate React copy,
  // which breaks hooks ("Cannot read properties of null (reading 'useState')").
  if (
    url.pathname.startsWith('/src') ||
    url.pathname.startsWith('/node_modules/.vite') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.includes('/hmr') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.mjs')
  ) {
    return;
  }

  // Route-specific caching strategies
  if (url.pathname.includes('/api/') || url.pathname.includes('/entities/')) {
    // API calls: network-first, fallback to cache
    return event.respondWith(networkFirstStrategy(request, CACHE_NAMES.DYNAMIC));
  }

  if (url.pathname.includes('TrainingLog') || url.pathname.includes('Event') || url.pathname.includes('DailyTraining')) {
    // Training data: network-first with aggressive cache fallback
    return event.respondWith(networkFirstStrategy(request, CACHE_NAMES.TRAINING));
  }

  if (url.pathname.includes('NotebookEntry') || url.pathname.includes('Notebook')) {
    // Notes: network-first with local cache
    return event.respondWith(networkFirstStrategy(request, CACHE_NAMES.NOTES));
  }

  // Default: cache-first for static assets
  event.respondWith(cacheFirstStrategy(request));
});

// Network-first strategy: try network, fallback to cache
function networkFirstStrategy(request, cacheName) {
  return fetch(request)
    .then((response) => {
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }

      const responseToCache = response.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseToCache);
      });

      return response;
    })
    .catch(() => {
      return caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }

        return new Response('Offline - data not available', { status: 503 });
      });
    });
}

// Cache-first strategy: use cache, fallback to network
function cacheFirstStrategy(request) {
  return caches.match(request).then((cached) => {
    if (cached) {
      return cached;
    }

    return fetch(request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAMES.CORE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        return caches.match('/offline.html');
      });
  });
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || '',
    icon: 'https://media.base44.com/images/public/691b84df6fc6a5089f596212/7555e8159_icon-192.png',
    badge: 'https://media.base44.com/images/public/691b84df6fc6a5089f596212/7555e8159_icon-192.png',
    tag: data.tag || 'pcw-notification',
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.actionUrl || '/',
      type: data.type || 'general',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PCW Academy', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { url } = event.notification.data;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if a window is already open with the target URL
      for (let client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-training-logs') {
    event.waitUntil(syncTrainingLogs());
  }
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncNotes());
  }
});

async function syncTrainingLogs() {
  try {
    const db = await openIndexedDB();
    const logs = await getAllFromIndexedDB(db, 'pending-logs');
    
    for (const log of logs) {
      await fetch('/api/entities/TrainingLog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
    }

    await clearIndexedDB(db, 'pending-logs');
  } catch (error) {
    console.error('Sync training logs failed:', error);
  }
}

async function syncNotes() {
  try {
    const db = await openIndexedDB();
    const notes = await getAllFromIndexedDB(db, 'pending-notes');
    
    for (const note of notes) {
      await fetch('/api/entities/NotebookEntry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
    }

    await clearIndexedDB(db, 'pending-notes');
  } catch (error) {
    console.error('Sync notes failed:', error);
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PCWAcademy', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-logs')) {
        db.createObjectStore('pending-logs', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending-notes')) {
        db.createObjectStore('pending-notes', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllFromIndexedDB(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function clearIndexedDB(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
