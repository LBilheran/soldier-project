// sw.js

// install event
self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('nom_du_cache')
        .then((cache) => {
          return cache.addAll([
            './',
            'index.html',
            'main.js',
            'manifest.json',
            'public/robot.png',
            'public/explode.wav',
            'public/music_AoW.mp3',
            'public/quarry_01_1k.hdr',
            'public/RobotExpressive.glb',
            'public/Michelle.glb'
         ]);
        })
        .then(() => {
          return self.skipWaiting();
        })
    );
  });
  
  // fetch event
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  