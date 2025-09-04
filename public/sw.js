// =====================================================
// SERVICE WORKER PARA CACHE OFFLINE
// =====================================================

const CACHE_NAME = 'tuwebai-dashboard-v1.0.0';
const STATIC_CACHE_NAME = 'tuwebai-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'tuwebai-dynamic-v1.0.0';

// Recursos estáticos para cache inmediato
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/logoweb.jpg',
  '/notification-sound.mp3',
  '/placeholder.svg',
  '/robots.txt'
];

// Recursos dinámicos para cache bajo demanda
const DYNAMIC_PATTERNS = [
  /^https:\/\/.*\.supabase\.co\/.*$/,
  /^https:\/\/fonts\.googleapis\.com\/.*$/,
  /^https:\/\/fonts\.gstatic\.com\/.*$/
];

// =====================================================
// INSTALACIÓN DEL SERVICE WORKER
// =====================================================

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        // Cachear recursos uno por uno para manejar respuestas 206
        return Promise.allSettled(
          STATIC_ASSETS.map(asset => {
            return fetch(asset)
              .then(response => {
                // Solo cachear respuestas exitosas y completas
                if (response.ok && response.status !== 206) {
                  return cache.put(asset, response);
                }
                return Promise.resolve();
              })
              .catch(() => {
                return Promise.resolve();
              });
          })
        );
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker installation error:', error);
      })
  );
});

// =====================================================
// ACTIVACIÓN DEL SERVICE WORKER
// =====================================================

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
            // Eliminar caches antiguos
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// =====================================================
// INTERCEPTACIÓN DE REQUESTS
// =====================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo interceptar requests HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Estrategia: Cache First para recursos estáticos
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Estrategia: Network Only para peticiones POST, PATCH, DELETE
  if (isNonCacheableRequest(request)) {
    event.respondWith(networkOnly(request));
    return;
  }
  
  // Estrategia: Network First para API calls GET
  if (isApiRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Estrategia: Stale While Revalidate para otros recursos
  event.respondWith(staleWhileRevalidate(request));
});

// =====================================================
// ESTRATEGIAS DE CACHE
// =====================================================

// Network Only: Para peticiones que no deben ser cacheadas
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('❌ Network Only Error:', error);
    return new Response('Error de red', { status: 503 });
  }
}

// Cache First: Para recursos estáticos que raramente cambian
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Cache First Error:', error);
    return new Response('Recurso no disponible offline', { status: 503 });
  }
}

// Network First: Para API calls que necesitan datos frescos
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Solo cachear peticiones GET exitosas
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Datos no disponibles offline', { status: 503 });
  }
}

// Stale While Revalidate: Para recursos que pueden usar versión cacheada
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    // Solo cachear peticiones GET exitosas y respuestas completas
    if (networkResponse.ok && request.method === 'GET' && networkResponse.status !== 206) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Si falla la red, devolver cache si existe
    return cachedResponse || new Response('Recurso no disponible', { status: 503 });
  });
  
  // Devolver cache inmediatamente si existe, luego actualizar en background
  return cachedResponse || fetchPromise;
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function isStaticAsset(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Recursos estáticos
  return pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.ico') ||
         pathname.endsWith('.woff') ||
         pathname.endsWith('.woff2') ||
         pathname.endsWith('.ttf') ||
         pathname.endsWith('.eot') ||
         pathname === '/' ||
         pathname === '/index.html';
}

function isApiRequest(request) {
  const url = new URL(request.url);
  
  // Supabase API - solo para peticiones GET
  if (url.hostname.includes('supabase.co') && request.method === 'GET') {
    return true;
  }
  
  // Otras APIs GET
  return (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) && 
         request.method === 'GET';
}

function isNonCacheableRequest(request) {
  // Peticiones que no deben ser cacheadas
  return request.method === 'POST' || 
         request.method === 'PATCH' || 
         request.method === 'DELETE' || 
         request.method === 'PUT';
}

// =====================================================
// MANEJO DE MENSAJES
// =====================================================

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
    self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      });
      break;
      
    default:
      // Mensaje desconocido ignorado
  }
});

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

// =====================================================
// NOTIFICACIONES PUSH (FUTURO)
// =====================================================

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver detalles',
          icon: '/favicon.ico'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/favicon.ico'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Service Worker cargado y listo