self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "QR Admin", body: "" };
  try {
    data = event.data?.json() || data;
  } catch {
    data.body = event.data?.text() || "";
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: { url: "/", event: data.event },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const eventType = event.notification.data?.event;
  const urlMap = {
    "ticket.created": "/helpdesk",
    "user.registered": "/merchants",
  };
  const urlToOpen = urlMap[eventType] || "/dashboard";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const matchingClient = windowClients.find(
          (c) => c.url.includes(urlToOpen),
        );
        if (matchingClient) {
          return matchingClient.focus();
        }
        return clients.openWindow(urlToOpen);
      }),
  );
});
