// Minimal Service Worker for Libur.in-App
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Activation steps if needed
});

self.addEventListener('fetch', event => {
  // Optionally handle fetch events
});
