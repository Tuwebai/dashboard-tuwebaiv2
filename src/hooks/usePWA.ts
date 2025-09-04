import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  isInstallPromptSupported: boolean;
  deferredPrompt: any;
  registration: ServiceWorkerRegistration | null;
}

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstalled: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    isInstallPromptSupported: false,
    deferredPrompt: null,
    registration: null
  });

  // Verificar si la app está instalada
  const checkIfInstalled = useCallback(() => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
    
    setPwaState(prev => ({ ...prev, isInstalled }));
  }, []);

  // Manejar cambios de conectividad
  const handleOnlineStatus = useCallback(() => {
    setPwaState(prev => ({ ...prev, isOnline: navigator.onLine }));
    
    if (navigator.onLine) {
      toast({
        title: 'Conexión restaurada',
        description: 'Ya estás conectado a internet',
      });
    } else {
      toast({
        title: 'Sin conexión',
        description: 'Algunas funciones pueden no estar disponibles',
        variant: 'destructive'
      });
    }
  }, []);

  // Registrar Service Worker
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        setPwaState(prev => ({ ...prev, registration }));

        // Escuchar actualizaciones del Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setPwaState(prev => ({ ...prev, isUpdateAvailable: true }));
                
                toast({
                  title: 'Actualización disponible',
                  description: 'Hay una nueva versión disponible. Recarga la página para actualizar.'
                });
              }
            });
          }
        });

        // console.log('Service Worker registrado:', registration);
      } catch (error) {
        console.error('Error registrando Service Worker:', error);
      }
    }
  }, []);

  // Manejar prompt de instalación
  const handleInstallPrompt = useCallback((event: Event) => {
    event.preventDefault();
    const installEvent = event as InstallPromptEvent;
    
    setPwaState(prev => ({
      ...prev,
      isInstallPromptSupported: true,
      deferredPrompt: installEvent
    }));

    toast({
      title: 'Instalar TuWebAI',
      description: 'Puedes instalar esta app en tu dispositivo para un mejor acceso'
    });
  }, []);

  // Instalar la app
  const installApp = useCallback(async () => {
    if (pwaState.deferredPrompt) {
      try {
        await pwaState.deferredPrompt.prompt();
        const { outcome } = await pwaState.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          toast({
            title: '¡Instalado!',
            description: 'TuWebAI ha sido instalado en tu dispositivo',
          });
          setPwaState(prev => ({ ...prev, isInstalled: true }));
        }
        
        setPwaState(prev => ({ ...prev, deferredPrompt: null }));
      } catch (error) {
        console.error('Error instalando la app:', error);
        toast({
          title: 'Error',
          description: 'No se pudo instalar la aplicación',
          variant: 'destructive'
        });
      }
    }
  }, [pwaState.deferredPrompt]);

  // Actualizar la app
  const updateApp = useCallback(() => {
    if (pwaState.registration && pwaState.registration.waiting) {
      pwaState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [pwaState.registration]);

  // Obtener información del cache
  const getCacheInfo = useCallback(async () => {
    if (pwaState.registration) {
      return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        pwaState.registration!.active?.postMessage(
          { type: 'GET_CACHE_INFO' },
          [channel.port2]
        );
      });
    }
  }, [pwaState.registration]);

  // Limpiar cache
  const clearCache = useCallback(async () => {
    if (pwaState.registration) {
      return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        pwaState.registration!.active?.postMessage(
          { type: 'CLEAR_CACHE' },
          [channel.port2]
        );
      });
    }
  }, [pwaState.registration]);

  // Suscribirse a notificaciones push
  const subscribeToPushNotifications = useCallback(async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted' && pwaState.registration) {
          const subscription = await pwaState.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
          });
          
          // Aquí se enviaría la subscription al servidor
          // console.log('Push subscription:', subscription);
          
          toast({
            title: 'Notificaciones activadas',
            description: 'Recibirás notificaciones de TuWebAI',
          });
          
          return subscription;
        }
      } catch (error) {
        console.error('Error suscribiéndose a notificaciones:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron activar las notificaciones',
          variant: 'destructive'
        });
      }
    }
  }, [pwaState.registration]);

  // Inicializar PWA
  useEffect(() => {
    checkIfInstalled();
    registerServiceWorker();

    // Event listeners
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setPwaState(prev => ({ ...prev, isInstalled: true }));
    });

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, [checkIfInstalled, registerServiceWorker, handleOnlineStatus, handleInstallPrompt]);

  return {
    ...pwaState,
    installApp,
    updateApp,
    getCacheInfo,
    clearCache,
    subscribeToPushNotifications
  };
}; 
