// frontend/public/sw.js
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = {
      title: "Nirshux Terminal",
      body: event.data ? event.data.text() : "",
    };
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag || `nirshux-${Date.now()}`,
    renotify: true,
    requireInteraction: !!data.sticky,
    vibrate: [120, 60, 120],
    timestamp: Date.now(),
    data: { url: data.url || "/admin-panel" },
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "Nirshux Terminal",
      options,
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    (event.notification.data && event.notification.data.url) || "/admin-panel",
    self.location.origin,
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (
            client.url.startsWith(self.location.origin) &&
            "focus" in client
          ) {
            return client
              .navigate(target)
              .then((c) => (c || client).focus())
              .catch(() => self.clients.openWindow(target));
          }
        }
        return self.clients.openWindow(target);
      }),
  );
});
