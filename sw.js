/* ==========================================
   SERVICE WORKER — sw.js
   Estratégia: Cache-First para assets estáticos
   ========================================== */

const CACHE_NAME = 'palete-camil-v1';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './dados.js',
  './manifest.json',
];

// ── INSTALL: cacheia todos os assets ───────
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando e cacheando assets...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => {
      console.log('[SW] Assets cacheados com sucesso!');
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE: limpa caches antigos ─────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando novo SW...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── FETCH: Cache-First, fallback para rede ─
self.addEventListener('fetch', (event) => {
  // Apenas requisições GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retorna do cache; atualiza em background (stale-while-revalidate)
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => { /* sem rede, ignora */ });

        return cachedResponse;
      }

      // Não está no cache: busca na rede e cacheia
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      }).catch(() => {
        // Offline e sem cache: retorna página principal como fallback
        return caches.match('./index.html');
      });
    })
  );
});
