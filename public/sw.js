// Lishna service worker — handles native device notifications.
// No offline caching; HTML continues to be served normally by the network.

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url); return c.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// Web Push (server-sent) handler — used if a push backend is configured later.
self.addEventListener('push', (event) => {
  let data = { title: 'לישנא', body: '', url: '/' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body, icon: '/icon-192.png', badge: '/favicon-32.png',
      dir: 'rtl', lang: 'he', data: { url: data.url },
    })
  );
});
