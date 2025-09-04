// =====================================================
// HOOK PARA GESTOS TÁCTILES EN NAVEGACIÓN MÓVIL
// =====================================================

import { useCallback, useRef, useEffect } from 'react';

interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  threshold?: number;
  longPressDelay?: number;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export const useTouchGestures = (options: TouchGestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onLongPress,
    threshold = 50,
    longPressDelay = 500
  } = options;

  const touchStartRef = useRef<TouchPoint | null>(null);
  const touchEndRef = useRef<TouchPoint | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const doubleTapDelay = 300;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const point: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    
    touchStartRef.current = point;
    touchEndRef.current = null;

    // Configurar long press
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress();
      }, longPressDelay);
    }
  }, [onLongPress, longPressDelay]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Cancelar long press si hay movimiento
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Cancelar long press
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const endPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    
    touchEndRef.current = endPoint;

    const deltaX = endPoint.x - touchStartRef.current.x;
    const deltaY = endPoint.y - touchStartRef.current.y;
    const deltaTime = endPoint.timestamp - touchStartRef.current.timestamp;

    // Determinar si es un swipe o tap
    const isSwipe = Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold;
    const isQuickTouch = deltaTime < 200;

    if (isSwipe) {
      // Determinar dirección del swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Swipe horizontal
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Swipe vertical
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    } else if (isQuickTouch && onTap) {
      // Detectar double tap
      const now = Date.now();
      if (now - lastTapRef.current < doubleTapDelay && onDoubleTap) {
        onDoubleTap();
        lastTapRef.current = 0; // Reset para evitar triple tap
      } else {
        onTap();
        lastTapRef.current = now;
      }
    }

    // Reset
    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, threshold]);

  const attachGestures = useCallback((element: HTMLElement) => {
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    attachGestures,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};

// Hook específico para navegación con gestos
export const useNavigationGestures = (navigate: (path: string) => void) => {
  return useTouchGestures({
    onSwipeLeft: () => {
      // Navegar a la página anterior (si existe historial)
      if (window.history.length > 1) {
        window.history.back();
      }
    },
    onSwipeRight: () => {
      // Navegar a la página siguiente (si existe historial)
      if (window.history.length > 1) {
        window.history.forward();
      }
    },
    onSwipeUp: () => {
      // Scroll hacia arriba
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onSwipeDown: () => {
      // Scroll hacia abajo
      window.scrollTo({ 
        top: document.documentElement.scrollHeight, 
        behavior: 'smooth' 
      });
    },
    onDoubleTap: () => {
      // Volver al dashboard
      navigate('/');
    },
    threshold: 50
  });
};

// Hook para gestos en modales
export const useModalGestures = (onClose: () => void) => {
  return useTouchGestures({
    onSwipeDown: onClose,
    onSwipeUp: () => {
      // Scroll hacia arriba en el modal
      const modal = document.querySelector('[role="dialog"]');
      if (modal) {
        modal.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    threshold: 100
  });
};

// Hook para gestos en listas
export const useListGestures = (onRefresh?: () => void) => {
  return useTouchGestures({
    onSwipeDown: () => {
      // Pull to refresh
      if (onRefresh) {
        onRefresh();
      }
    },
    onSwipeUp: () => {
      // Scroll hacia abajo en la lista
      const list = document.querySelector('[role="list"]');
      if (list) {
        list.scrollTo({ 
          top: list.scrollHeight, 
          behavior: 'smooth' 
        });
      }
    },
    threshold: 80
  });
};

export default useTouchGestures;
