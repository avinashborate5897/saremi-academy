// Saremi Academy Service Worker - Cache First for Assets, Network First for Data
const CACHE_NAME = 'saremi-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Pass through non-GET and chrome-extension or API requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/@') || 
    url.pathname.startsWith('/src') || 
    url.pathname.startsWith('/node_modules') || 
    url.pathname.includes('vite') ||
    url.hostname.includes('firebaseio.com') || 
    url.hostname.includes('firestore.googleapis.com') ||
    self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1' ||
    self.location.hostname.includes('run.app')
  ) {
    return;
  }

  // Stale-while-revalidate for local assets and CDN scripts
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return cached version or fallback to root if offline navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Push Notification Event Listener for Mobile Home Screen Reminders
self.addEventListener('push', (event) => {
  let data = {
    title: 'Saremi Academy - 1:1 Class Reminder 🎵',
    body: 'Your upcoming live music mentorship session starts soon! Tap to join classroom.',
    icon: '/saremi-logo.png',
    badge: '/saremi-logo.png',
    data: { url: '/app/classes' }
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
    icon: data.icon || '/saremi-logo.png',
    badge: data.badge || '/saremi-logo.png',
    vibrate: [200, 100, 200],
    tag: 'saremi-class-reminder',
    renotify: true,
    data: data.data || { url: '/app/classes' },
    actions: [
      { action: 'open_classroom', title: '🎵 Join Class' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle Notification Click and Mobile Navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/app/classes';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

