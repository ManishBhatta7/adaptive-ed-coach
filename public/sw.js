const CACHE_NAME = 'educoach-v1.0.0';
const OFFLINE_URL = '/offline.html';

const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

const RUNTIME_CACHE_URLS = [
  '/metacognition',
  '/dashboard',
  '/ai-tutor',
  '/collaboration',
  '/assessments',
  '/gamification'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('Service worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Static resources cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - network first with cache fallback
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

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses for offline access
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline indicator for API requests
              return new Response(
                JSON.stringify({
                  error: 'offline',
                  message: 'You are currently offline. Some features may not be available.'
                }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(response => {
            // Cache new resources
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            // Return empty response for other requests
            return new Response('', { status: 503 });
          });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
  
  if (event.tag === 'sync-reflections') {
    event.waitUntil(syncOfflineReflections());
  }
});

// Push notification handling
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    vibrate: [200, 100, 200],
    data: data.data,
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/open-action.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-action.png'
      }
    ],
    requireInteraction: data.requireInteraction || false,
    silent: false,
    tag: data.tag || 'default',
    renotify: true,
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(location.origin)) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: urlToOpen,
              data: event.notification.data
            });
            return;
          }
        }
        
        // Open new window if app is not open
        return clients.openWindow(urlToOpen);
      })
  );
});

// Message handling for client communication
self.addEventListener('message', event => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
    return;
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(event.data.urls))
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch(error => {
          event.ports[0].postMessage({ success: false, error: error.message });
        })
    );
    return;
  }
});

// Utility functions for background sync
async function syncOfflineData() {
  try {
    console.log('Syncing offline data...');
    
    // Get offline data from IndexedDB (would need to implement)
    const offlineData = await getOfflineDataFromStorage();
    
    if (offlineData.length === 0) {
      return;
    }

    // Send data to server
    for (const item of offlineData) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item)
        });
        
        // Remove synced item from offline storage
        await removeOfflineData(item.id);
        
      } catch (error) {
        console.error('Failed to sync item:', item.id, error);
      }
    }
    
    console.log('Offline data sync completed');
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function syncOfflineReflections() {
  try {
    console.log('Syncing offline reflections...');
    
    // Get offline reflections from storage
    const offlineReflections = await getOfflineReflectionsFromStorage();
    
    for (const reflection of offlineReflections) {
      try {
        const response = await fetch('/api/reflections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reflection)
        });
        
        if (response.ok) {
          await removeOfflineReflection(reflection.tempId);
        }
        
      } catch (error) {
        console.error('Failed to sync reflection:', reflection.tempId, error);
      }
    }
    
    console.log('Offline reflections sync completed');
    
  } catch (error) {
    console.error('Reflection sync failed:', error);
  }
}

// Placeholder functions for offline storage (would implement with IndexedDB)
async function getOfflineDataFromStorage() {
  // Implementation would use IndexedDB to get offline data
  return [];
}

async function removeOfflineData(id) {
  // Implementation would remove item from IndexedDB
  console.log('Removing offline data item:', id);
}

async function getOfflineReflectionsFromStorage() {
  // Implementation would get offline reflections from IndexedDB
  return [];
}

async function removeOfflineReflection(tempId) {
  // Implementation would remove reflection from IndexedDB
  console.log('Removing offline reflection:', tempId);
}

// Periodic background sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Share target handling
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/share' && url.searchParams.has('text')) {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const sharedData = {
          title: formData.get('title') || '',
          text: formData.get('text') || '',
          url: formData.get('url') || ''
        };
        
        // Store shared data for the app to retrieve
        await storeSharedData(sharedData);
        
        return Response.redirect('/share-received', 302);
      })()
    );
  }
});

async function storeSharedData(data) {
  // Store in cache for the app to retrieve
  const cache = await caches.open(CACHE_NAME);
  await cache.put(
    '/shared-data',
    new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
  );
}

console.log('Service worker loaded');