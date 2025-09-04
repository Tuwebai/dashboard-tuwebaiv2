import { useState, useEffect, useCallback } from 'react';

export interface MobileOptimizationConfig {
  enableTouchOptimization: boolean;
  enableSwipeGestures: boolean;
  enableHapticFeedback: boolean;
  touchTargetSize: number; // Tamaño mínimo para targets táctiles
  swipeThreshold: number; // Distancia mínima para detectar swipe
}

export interface TouchEvent {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  velocity: number;
}

export function useMobileOptimization(config: Partial<MobileOptimizationConfig> = {}) {
  const defaultConfig: MobileOptimizationConfig = {
    enableTouchOptimization: true,
    enableSwipeGestures: true,
    enableHapticFeedback: true,
    touchTargetSize: 44, // 44px mínimo según Apple HIG
    swipeThreshold: 50
  };

  const finalConfig = { ...defaultConfig, ...config };
  
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  // Detectar tipo de dispositivo
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      
      // Detectar móvil
      const mobile = width <= 768;
      setIsMobile(mobile);
      
      // Detectar tablet
      const tablet = width > 768 && width <= 1024;
      setIsTablet(tablet);
      
      // Detectar dispositivo táctil
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(touch);
      
      // Detectar orientación
      setOrientation(height > width ? 'portrait' : 'landscape');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!finalConfig.enableHapticFeedback || !isTouchDevice) return;

    try {
      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30]
        };
        navigator.vibrate(patterns[type]);
      }
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }
  }, [finalConfig.enableHapticFeedback, isTouchDevice]);

  // Detectar swipe gestures
  const useSwipeGesture = useCallback((
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void,
    onSwipeUp?: () => void,
    onSwipeDown?: () => void
  ) => {
    if (!finalConfig.enableSwipeGestures) return {};

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return;

      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

      // Verificar si es un swipe válido
      if (Math.abs(deltaX) > finalConfig.swipeThreshold || Math.abs(deltaY) > finalConfig.swipeThreshold) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (absDeltaX > absDeltaY) {
          // Swipe horizontal
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        } else {
          // Swipe vertical
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }

        triggerHaptic('light');
      }

      // Reset
      startX = 0;
      startY = 0;
      startTime = 0;
    };

    return {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd
    };
  }, [finalConfig.enableSwipeGestures, finalConfig.swipeThreshold, triggerHaptic]);

  // Optimizar elementos para touch
  const getTouchOptimizedStyle = useCallback((baseStyle: React.CSSProperties = {}) => {
    if (!finalConfig.enableTouchOptimization) return baseStyle;

    return {
      ...baseStyle,
      minHeight: finalConfig.touchTargetSize,
      minWidth: finalConfig.touchTargetSize,
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      cursor: isTouchDevice ? 'pointer' : baseStyle.cursor || 'pointer'
    };
  }, [finalConfig.enableTouchOptimization, finalConfig.touchTargetSize, isTouchDevice]);

  // Clases CSS para responsividad
  const getResponsiveClasses = useCallback((baseClasses: string = '') => {
    const classes = [baseClasses];
    
    if (isMobile) {
      classes.push('mobile-optimized');
    }
    
    if (isTablet) {
      classes.push('tablet-optimized');
    }
    
    if (isTouchDevice) {
      classes.push('touch-optimized');
    }
    
    if (orientation === 'portrait') {
      classes.push('portrait');
    } else {
      classes.push('landscape');
    }

    return classes.join(' ');
  }, [isMobile, isTablet, isTouchDevice, orientation]);

  // Detectar si está en modo PWA
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true;

  // Detectar conexión
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    // Estado del dispositivo
    isMobile,
    isTablet,
    isTouchDevice,
    isPWA,
    isOnline,
    orientation,
    screenSize,
    
    // Funciones de optimización
    triggerHaptic,
    useSwipeGesture,
    getTouchOptimizedStyle,
    getResponsiveClasses,
    
    // Configuración
    config: finalConfig
  };
}
