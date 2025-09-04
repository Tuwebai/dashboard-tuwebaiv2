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
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Cacheando recursos estáticos...');
        // Cachear recursos uno por uno para manejar respuestas 206
        return Promise.allSettled(
          STATIC_ASSETS.map(asset => {
            return fetch(asset)
              .then(response => {
                // Solo cachear respuestas exitosas y completas
                if (response.ok && response.status !== 206) {
                  return cache.put(asset, response);
                } else {
                  console.warn(`⚠️ Service Worker: Saltando recurso ${asset} (status: ${response.status})`);
                  return Promise.resolve();
                }
              })
              .catch(error => {
                console.warn(`⚠️ Service Worker: Error cacheando ${asset}:`, error);
                return Promise.resolve();
              });
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Instalación completada');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Error en instalación:', error);
      })
  );
});

// =====================================================
// ACTIVACIÓN DEL SERVICE WORKER
// =====================================================

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
            // Eliminar caches antiguos
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
      .then(() => {
        console.log('✅ Service Worker: Activación completada');
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
  
  // Estrategia: Network First para API calls
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
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('🌐 Network First: Fallback a cache');
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
    if (networkResponse.ok) {
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
  
  // Supabase API
  if (url.hostname.includes('supabase.co')) {
    return true;
  }
  
  // Otras APIs
  return url.pathname.startsWith('/api/') ||
         url.pathname.startsWith('/auth/') ||
         request.method !== 'GET';
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
      console.log('📨 Service Worker: Mensaje desconocido:', type);
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
  console.log('🗑️ Service Worker: Todos los caches eliminados');
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

console.log('🎯 Service Worker: Cargado y listo');