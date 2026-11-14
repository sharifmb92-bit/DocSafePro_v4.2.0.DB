/* =========================================================
   DocSafe 4.2.0 - Service Worker & Motor PWA
   Sello: medbasha
   ========================================================= */

const CACHE_NAME = 'docsafe-v4-2-0';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercepta el envío POST de Android al compartir un documento
  if (event.request.method === 'POST' && url.searchParams.has('shared')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const file = formData.get('file');
          if (file) {
            const shareCache = await caches.open('docsafe-share');
            const headers = new Headers({
              'Content-Type': file.type || 'application/octet-stream',
              'X-File-Name': encodeURIComponent(file.name || 'Documento_Compartido')
            });
            await shareCache.put('/shared-file', new Response(file, { headers }));
          }
        } catch (err) {
          console.error('Error capturando archivo compartido:', err);
        }
        return Response.redirect('./index.html?shared=1', 303);
      })()
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
