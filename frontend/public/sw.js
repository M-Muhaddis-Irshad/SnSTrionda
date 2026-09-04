// =============================================================================
// Trionda Wears — Service Worker
// Offline-ready app shell: caches static assets + shell routes only.
// Never caches API responses or user-specific data (all /api/* traffic
// and cross-origin requests are passed straight through).
// =============================================================================

const CACHE_NAME = "trionda-shell-v1";

// App-shell assets: pages + static files that make the UI render offline.
// Versioned by CACHE_NAME — bump the version to invalidate on deploy.
const SHELL_URLS = [
  "/",
  "/manifest.json",
  "/logo/trionda-icon-mark.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET requests.
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Never intercept API calls — data stays live, no stale/user data cached.
  if (url.pathname.startsWith("/api/")) return;

  // Never cache auth/admin/account pages (user-specific).
  if (/^\/(admin|account|checkout|order-confirmation)(\/|$)/.test(url.pathname)) return;

  // Navigation requests: network-first, fall back to cached shell offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Keep the latest HTML for future offline navigations.
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Static assets: cache-first, then network (and cache the success).
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});