const CACHE_NAME = 'smart-task-list-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME
            })
            .map((cacheName) => {
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Cache hit - return the response from the cached version
        if (response) {
          return response
        }

        // Not in cache - return the result from the live server
        // and add it to the cache for future
        return fetch(event.request).then((networkResponse) => {
          // Don't cache if not a valid response
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse
          }

          // IMPORTANT: Clone the response. A response is a stream
          // and can only be consumed once. Since we want to return
          // the response and put it in cache, we need to clone it.
          const responseToCache = networkResponse.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return networkResponse
        })
      })
      .catch(() => {
        // If both cache and network fail, show a generic fallback
        return new Response('Network error happened', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' },
        })
      })
  )
})

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  let notification = {
    title: 'Задачник',
    body: 'У вас есть задачки!',
  }

  // Try to parse data from the push event
  if (event.data) {
    try {
      notification = { ...notification, ...event.data.json() }
    } catch (e) {
      console.error('Error parsing push notification data:', e)
    }
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
      },
      actions: [
        {
          action: 'explore',
          title: 'View Tasks',
        },
        {
          action: 'close',
          title: 'Close',
        },
      ],
    })
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    // Open the app and focus on it
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // If a window client is already open, focus it
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
    )
  }
})
