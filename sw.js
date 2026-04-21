// sw.js - Versión de limpieza forzada
const CACHE_NAME = 'tablero-v' + Date.now(); // Cambia el nombre para forzar actualización

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Obliga al nuevo service worker a activarse de inmediato
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    return caches.delete(cache); // Borra TODA la memoria vieja
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // No guarda nada en caché por ahora para que podamos debuguear
    event.respondWith(fetch(event.request));
});
