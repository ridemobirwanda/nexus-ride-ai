const CACHE_NAME = 'nexus-ride-v3';
const STATIC_CACHE = 'nexus-static-v3';
const DYNAMIC_CACHE = 'nexus-dynamic-v3';

// Core assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pin-icon.png',
  '/placeholder.svg',
  '/favicon.ico'
];

// Install service worker and cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.log('Failed to cache some assets:', err);
      })
  );
  self.skipWaiting();
});

// Network-first strategy for API calls
const networkFirst = async (request) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

// Cache-first strategy for static assets
const cacheFirst = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    throw error;
  }
};

// Stale-while-revalidate for images
const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
};

// Fetch handler with different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API calls - network first
  if (url.pathname.includes('/rest/') || url.pathname.includes('/functions/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Images - stale while revalidate
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/i)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Static assets (JS, CSS, fonts) - cache first
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/i)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation requests - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cache = caches.open(DYNAMIC_CACHE);
          cache.then((c) => c.put(request, response.clone()));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Default - cache first
  event.respondWith(cacheFirst(request));
});

// Update service worker and clean old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let data = {
    title: 'Ride Update',
    body: 'You have a new ride update',
    icon: '/pin-icon.png',
    badge: '/pin-icon.png'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pin-icon.png',
    badge: data.badge || '/pin-icon.png',
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || 'ride-update',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/passenger';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already an open window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if none exists
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.payload;
    self.registration.showNotification(title, {
      icon: '/pin-icon.png',
      badge: '/pin-icon.png',
      vibrate: [200, 100, 200],
      ...options
    });
  }
});
