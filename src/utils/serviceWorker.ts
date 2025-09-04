// =====================================================
// UTILIDADES PARA SERVICE WORKER
// =====================================================

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

// =====================================================
// HOOK PARA REACT (MOVED TO .tsx FILE)
// =====================================================
// El hook useServiceWorker se ha movido al archivo .tsx correspondiente

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

// =====================================================
// HOOK PARA DETECTAR CONECTIVIDAD (MOVED TO .tsx FILE)
// =====================================================
// El hook useOnlineStatus se ha movido al archivo .tsx correspondiente
