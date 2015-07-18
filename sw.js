// Chrome's currently missing some useful cache methods,
// this polyfill adds them.
importScripts('serviceworker-cache-polyfill.js');

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('simple-sw-v3').then(function(cache) {
      return cache.addAll([
        './',
        '/assets/images/chrome/chrome_128x128.png',
        '/assets/images/firefox/firefox_128x128.png',
        '/assets/images/internet-explorer/internet-explorer_128x128.png',
        '/assets/images/opera/opera_128x128.png',
        '/assets/images/safari/safari_128x128.png',
        new Request('https://justmarkup.com/piwik/piwik.js', {mode: 'no-cors'})
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
