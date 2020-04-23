var CACHE_NAME = 'cf-cache';
var urlsToCache = [
	'/',
	'/css/site.css',
	'/js/jquery.min.js',
	'/js/luxon.min.js',
	'/js/site.js',
	'/img/logo.png',
	'/img/critters.png',
	'/img/hemi_north.png',
	'/img/hemi_south.png'
];

self.addEventListener('install', function(event) {
	self.skipWaiting();

	// Perform install steps
	event.waitUntil(
		caches.open(CACHE_NAME).then(function(cache) {
			//console.log('Opened cache');
			return cache.addAll(urlsToCache);
		})
	);
});

self.addEventListener('activate', function(event) {  
	event.waitUntil(
	  caches.keys().then(function(cacheNames) {
		return Promise.all(cacheNames.map(function(cacheName) { return caches.delete(cacheName); }));
	  })
	);
  });

self.addEventListener('fetch', function(event) {
	event.respondWith(
		caches.match(event.request)
			.then(function(response) {
			// Cache hit - return response
			if (response) { return response; }

			return fetch(event.request);
		})
	);
  });