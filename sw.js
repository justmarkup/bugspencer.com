// Chrome's currently missing some useful cache methods,
// this polyfill adds them.
importScripts('serviceworker-cache-polyfill.js');

var version = '1.1.0::';

var offlineFundamentals = [
	'./',
	'/edge/',
	'/firefox/',
	'/opera/',
	'/chrome/',
	'/safari/',
	'/assets/images/chrome/chrome_128x128.png',
	'/assets/images/firefox/firefox_128x128.png',
	'/assets/images/edge/edge_128x128.png',
	'/assets/images/opera/opera_128x128.png',
	'/assets/images/safari/safari_128x128.png'
];

var updateStaticCache = function() {
	return caches.open(version + 'fundamentals').then(function(cache) {
		return Promise.all(offlineFundamentals.map(function(value) {
			var request = new Request(value);
			var url = new URL(request.url);
			if (url.origin != location.origin) {
				request = new Request(value, {mode: 'no-cors'});
			}
			return fetch(request).then(function(response) { 
				var cachedCopy = response.clone();
				return cache.put(request, cachedCopy); 
				
			});
		}))
	})
};

//Clear caches with a different version number
var clearOldCaches = function() {
	return caches.keys().then(function(keys) {
		return Promise.all(
			keys
				.filter(function (key) {
						return key.indexOf(version) != 0;
				})
				.map(function (key) {
						return caches.delete(key);
				})
		);
	})
};

/*
	limits the cache
	If cache has more than maxItems then it removes the first item in the cache
*/
var limitCache = function(cache, maxItems) {
	cache.keys().then(function(items) {
		if (items.length > maxItems) {
			cache.delete(items[0]);
		}
	})
};


//When the service worker is first added to a computer
self.addEventListener("install", function(event) {
	event.waitUntil(updateStaticCache()
				.then(function() { 
					return self.skipWaiting(); 
				})
			);
})


//Service worker handles networking
self.addEventListener("fetch", function(event) {

	//Fetch from network and cache
	var fetchFromNetwork = function(response) {
		var cacheCopy = response.clone();
		if (event.request.headers.get('Accept').indexOf('text/html') != -1) {
			caches.open(version + 'pages').then(function(cache) {
				cache.put(event.request, cacheCopy).then(function() {
					limitCache(cache, 25);
				})
			});
		} else if (event.request.headers.get('Accept').indexOf('image') != -1) {
			caches.open(version + 'images').then(function(cache) {
				cache.put(event.request, cacheCopy).then(function() {
					limitCache(cache, 10); 
				});
			});
		} else {
			caches.open(version + 'assets').then(function add(cache) {
				cache.put(event.request, cacheCopy);
			});
		}

		return response;
	}

	//Fetch from network failed
	var fallback = function() {
		if (event.request.headers.get('Accept').indexOf('text/html') != -1) {
			return caches.match(event.request).then(function (response) { 
				return response || caches.match(theme_path + 'offline.html');
			})
		} 
	}
	
	//This service worker won't touch non-get requests
	if (event.request.method != 'GET') {
		return;
	}
	
	//For HTML requests, look for file in network, then cache if network fails.
	if (event.request.headers.get('Accept').indexOf('text/html') != -1) {
					event.respondWith(fetch(event.request).then(fetchFromNetwork, fallback));
		return;
			}

	//For non-HTML requests, look for file in cache, then network if no cache exists.
	event.respondWith(
		caches.match(event.request).then(function(cached) {
			return cached || fetch(event.request).then(fetchFromNetwork, fallback);
		})
	) 
});

//After the install event
self.addEventListener("activate", function(event) {
	event.waitUntil(clearOldCaches()
				.then(function() {
					return self.clients.claim();
				})
			);
});
