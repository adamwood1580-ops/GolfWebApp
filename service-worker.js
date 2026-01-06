const CACHE_NAME = "4bbb-cache-v1";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./script.js",
  "./manifest.json",
  "./fairway.JPG"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});