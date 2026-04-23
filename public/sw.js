// @ts-nocheck
const CACHE = "localgpt-offline-v2";

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (!self.workbox) {
  console.error("Workbox failed to load");
} else {
  const { routing, strategies } = self.workbox;

  // Only cache same-origin GET requests for app shell/assets.
  // The previous catch-all route tried to intercept every fetch, including
  // requests that should not be cached, which caused noisy fetch failures.
  routing.registerRoute(
    ({ request, url }) =>
      request.method === 'GET' &&
      url.origin === self.location.origin &&
      (request.destination === 'document' ||
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image' ||
        request.destination === 'font' ||
        request.destination === 'worker'),
    new strategies.StaleWhileRevalidate({
      cacheName: CACHE
    })
  );
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
