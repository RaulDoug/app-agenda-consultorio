// CliniAssist Service Worker — PWA Offline Shell Cache
const CACHE_NAME = 'cliniassist-app-shell-v4';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/@react-refresh',
  '/@vite/client',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.debug('[SW] Pré-cache não crítico durante install:', asset, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora protocolos não-HTTP (ex: ws://, wss://, chrome-extension://)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Não intercepta chamadas de API do backend (controladas pelo SyncManager / Dexie)
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // 1. Requisição de navegação de página (HTML / F5)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Em modo Offline: retorna index.html em cache para carregar a SPA
          const cachedResponse =
            (await caches.match('/index.html', { ignoreSearch: true })) ||
            (await caches.match('/', { ignoreSearch: true }));
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // 2. Requisição de assets estáticos (JS, CSS, imagens, fontes e módulos Vite)
  event.respondWith(
    (async () => {
      const cleanUrl = url.origin + url.pathname;
      const cache = await caches.open(CACHE_NAME);

      // Tenta buscar no cache pelo request exato ou pela URL limpa sem query param (?t=... / ?v=...)
      let cached =
        (await cache.match(event.request, { ignoreSearch: true })) ||
        (await cache.match(cleanUrl, { ignoreSearch: true }));

      // Se encontrado em cache:
      if (cached) {
        // Se estiver online, atualiza o cache em segundo plano (Stale-While-Revalidate)
        if (self.navigator.onLine) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
                cache.put(cleanUrl, networkResponse);
              }
            })
            .catch(() => {});
        }
        return cached;
      }

      // Se não está em cache e está online: tenta buscar na rede
      try {
        const response = await fetch(event.request);
        if (response && response.status === 200) {
          cache.put(event.request, response.clone());
          cache.put(cleanUrl, response.clone());
        }
        return response;
      } catch (err) {
        // Fallback offline se a rede falhou
        const fallback =
          (await cache.match(event.request, { ignoreSearch: true })) ||
          (await cache.match(cleanUrl, { ignoreSearch: true }));
        if (fallback) {
          return fallback;
        }

        return new Response('Offline resource not cached', { status: 408, statusText: 'Offline' });
      }
    })()
  );
});
