// Service Worker for receptive-accretion (Astro Blog)
// Version: v1.0
const CACHE_NAME = "v1.0";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/styles/global.css",
  "/fonts/atkinson-regular.woff2",
  "/fonts/atkinson-bold.woff2",
  "/icons/favicon.ico",
];

// Install event - cache static assets
/* eslint-disable no-console */
self.addEventListener("install", (event) => {
  /* eslint-disable-next-line no-console */
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        /* eslint-disable-next-line no-console */
        console.log("[Service Worker] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        /* eslint-disable-next-line no-console */
        console.log("[Service Worker] Installation complete");
        return self.skipWaiting();
      })
  );
});
/* eslint-enable no-console */

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  /* eslint-disable-next-line no-console */
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              /* eslint-disable-next-line no-console */
              console.log("[Service Worker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        /* eslint-disable-next-line no-console */
        console.log("[Service Worker] Activation complete");
        return self.clients.claim();
      })
  );
});

// Fetch event - cache-first with network fallback
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests and browser extensions
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith("http")) return;

  // Check if it's an API request
  const isApiRequest =
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("api.") ||
    url.search.includes("api=");

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        /* eslint-disable-next-line no-console */
        console.log("[Service Worker] Serving from cache:", url.pathname);
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          // Don't cache non-successful responses
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Don't cache API responses (they change frequently)
          if (isApiRequest) {
            return networkResponse;
          }

          // Clone the response (stream can only be consumed once)
          const responseToCache = networkResponse.clone();

          // Cache successful responses (except API calls)
          caches.open(CACHE_NAME).then((cache) => {
            // Don't cache large files (>5MB)
            const contentLength = networkResponse.headers.get("content-length");
            if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
              /* eslint-disable-next-line no-console */
              console.log("[Service Worker] Skipping cache for large file:", url.pathname);
              return;
            }

            // Don't cache non-cacheable responses
            const cacheControl = networkResponse.headers.get("cache-control");
            if (cacheControl && cacheControl.includes("no-store")) {
              /* eslint-disable-next-line no-console */
              console.log("[Service Worker] Skipping cache for no-store:", url.pathname);
              return;
            }

            /* eslint-disable-next-line no-console */
            console.log("[Service Worker] Caching new resource:", url.pathname);
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch((error) => {
          /* eslint-disable-next-line no-console */
          console.error("[Service Worker] Fetch failed:", error);

          // Provide fallback for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html").then((offlineResponse) => {
              return (
                offlineResponse ||
                new Response("<h1>Offline</h1><p>Please check your internet connection.</p>", {
                  headers: { "Content-Type": "text/html" },
                })
              );
            });
          }

          // For other requests, return an error response
          return new Response("Network error", {
            status: 408,
            headers: { "Content-Type": "text/plain" },
          });
        });
    })
  );
});

// Background sync for failed requests
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-articles") {
    /* eslint-disable-next-line no-console */
    console.log("[Service Worker] Background sync triggered");
    event.waitUntil(syncArticles());
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  /* eslint-disable-next-line no-console */
  console.log("[Service Worker] Push notification received");

  const options = {
    body: event.data ? event.data.text() : "New content available!",
    icon: "/icons/notification.png",
    badge: "/icons/badge.png",
    tag: "content-update",
    requireInteraction: true,
    actions: [
      { action: "view", title: "View" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification("My Blog", options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  /* eslint-disable-next-line no-console */
  console.log("[Service Worker] Notification clicked");
  event.notification.close();

  if (event.action === "view") {
    event.waitUntil(self.clients.openWindow("/blog"));
  }
});

// Helper function for background sync
async function syncArticles() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const articles = await fetch("/api/articles?since=last-sync");
    const articlesData = await articles.json();

    // Cache new articles
    for (const article of articlesData) {
      const articleUrl = `/blog/${article.slug}`;
      const articleResponse = await fetch(articleUrl);

      if (articleResponse.ok) {
        await cache.put(articleUrl, articleResponse.clone());
        /* eslint-disable-next-line no-console */
        console.log("[Service Worker] Synced article:", article.slug);
      }
    }

    console.log("[Service Worker] Background sync complete");
  } catch (error) {
    console.error("[Service Worker] Background sync failed:", error);
  }
}

// Listen for messages from clients
self.addEventListener("message", (event) => {
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CLEAR_CACHE") {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }
});
