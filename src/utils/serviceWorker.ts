// =====================================================
// UTILIDADES PARA SERVICE WORKER
// =====================================================

import React from 'react';

interface ServiceWorkerMessage {
  type: string;
  payload?: any;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = 'serviceWorker' in navigator;

  // Registrar el service worker
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) {
      console.warn('⚠️ Service Worker no soportado en este navegador');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registrado exitosamente:', this.registration.scope);

      // Manejar actualizaciones
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión disponible
              this.showUpdateNotification();
            }
          });
        }
      });

      return this.registration;
    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
      return null;
    }
  }

  // Verificar si hay actualizaciones disponibles
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('❌ Error verificando actualizaciones:', error);
      return false;
    }
  }

  // Limpiar todos los caches
  async clearCache(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.sendMessage({ type: 'CLEAR_CACHE' });
      console.log('🗑️ Cache limpiado exitosamente');
    } catch (error) {
      console.error('❌ Error limpiando cache:', error);
    }
  }

  // Obtener tamaño del cache
  async getCacheSize(): Promise<number> {
    if (!this.registration) {
      return 0;
    }

    try {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          if (event.data.type === 'CACHE_SIZE') {
            resolve(event.data.size);
          }
        };

        this.sendMessage({ type: 'GET_CACHE_SIZE' }, [messageChannel.port2]);
      });
    } catch (error) {
      console.error('❌ Error obteniendo tamaño del cache:', error);
      return 0;
    }
  }

  // Enviar mensaje al service worker
  private async sendMessage(message: ServiceWorkerMessage, transfer?: Transferable[]): Promise<void> {
    if (!this.registration?.active) {
      throw new Error('Service Worker no está activo');
    }

    this.registration.active.postMessage(message, transfer);
  }

  // Mostrar notificación de actualización
  private showUpdateNotification(): void {
    if (confirm('¡Nueva versión disponible! ¿Deseas actualizar ahora?')) {
      this.updateServiceWorker();
    }
  }

  // Actualizar service worker
  private updateServiceWorker(): void {
    if (!this.registration) {
      return;
    }

    this.sendMessage({ type: 'SKIP_WAITING' });
    
    // Recargar la página después de la actualización
    window.location.reload();
  }

  // Verificar estado del service worker
  getStatus(): {
    isSupported: boolean;
    isRegistered: boolean;
    isActive: boolean;
    scope: string | null;
  } {
    return {
      isSupported: this.isSupported,
      isRegistered: !!this.registration,
      isActive: !!this.registration?.active,
      scope: this.registration?.scope || null
    };
  }
}

// Instancia singleton
export const serviceWorkerManager = new ServiceWorkerManager();

// Hook para usar en React
export const useServiceWorker = () => {
  const [status, setStatus] = React.useState(serviceWorkerManager.getStatus());
  const [cacheSize, setCacheSize] = React.useState(0);

  React.useEffect(() => {
    // Registrar service worker al cargar
    serviceWorkerManager.register().then(() => {
      setStatus(serviceWorkerManager.getStatus());
    });

    // Obtener tamaño del cache
    serviceWorkerManager.getCacheSize().then(setCacheSize);

    // Verificar actualizaciones cada 5 minutos
    const updateInterval = setInterval(() => {
      serviceWorkerManager.checkForUpdates();
    }, 5 * 60 * 1000);

    return () => clearInterval(updateInterval);
  }, []);

  const clearCache = React.useCallback(async () => {
    await serviceWorkerManager.clearCache();
    const newSize = await serviceWorkerManager.getCacheSize();
    setCacheSize(newSize);
  }, []);

  const checkForUpdates = React.useCallback(async () => {
    await serviceWorkerManager.checkForUpdates();
  }, []);

  const refreshCacheSize = React.useCallback(async () => {
    const size = await serviceWorkerManager.getCacheSize();
    setCacheSize(size);
  }, []);

  return {
    status,
    cacheSize,
    clearCache,
    checkForUpdates,
    refreshCacheSize
  };
};

// Función para formatear bytes
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Función para verificar si la app está offline
export const isOffline = (): boolean => {
  return !navigator.onLine;
};

// Función para verificar si la app está online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Hook para detectar cambios de conectividad
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
