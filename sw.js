/* Service Worker de EncyVerse.
   Sube este número cada vez que subas una versión nueva de index.html
   para que los usuarios reciban la actualización en vez de la copia en caché. */
const CACHE_VERSION = 'encyverse-v2';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Estrategia: red primero (para que siempre intentes coger la última versión
   subida a GitHub Pages), y si no hay red, se sirve la copia guardada en caché
   para que la app se pueda abrir sin conexión. Los datos reales (fichas,
   imágenes) no pasan por aquí: viven en IndexedDB, no en este caché. */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
