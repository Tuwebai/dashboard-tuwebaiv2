// =====================================================
// PROVEEDOR DE GESTOS TÁCTILES PARA NAVEGACIÓN MÓVIL
// =====================================================

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTouchGestures, useNavigationGestures } from '@/hooks/useTouchGestures';

interface TouchGestureProviderProps {
  children: React.ReactNode;
  enableNavigationGestures?: boolean;
  enableGlobalGestures?: boolean;
}

export const TouchGestureProvider: React.FC<TouchGestureProviderProps> = ({
  children,
  enableNavigationGestures = true,
  enableGlobalGestures = true
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Gestos de navegación
  const navigationGestures = useNavigationGestures(navigate);

  // Gestos globales adicionales
  const globalGestures = useTouchGestures({
    onSwipeLeft: () => {
      // Navegar a la página anterior
      if (window.history.length > 1) {
        window.history.back();
      }
    },
    onSwipeRight: () => {
      // Navegar a la página siguiente
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

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | undefined;

    if (enableGlobalGestures) {
      cleanup = globalGestures.attachGestures(containerRef.current);
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [enableGlobalGestures, globalGestures]);

  return (
    <div 
      ref={containerRef}
      className="touch-gesture-provider"
      style={{
        touchAction: 'pan-x pan-y',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      {children}
    </div>
  );
};

// Hook para usar gestos en componentes específicos
export const useTouchGestureProvider = () => {
  const navigate = useNavigate();
  
  return {
    navigationGestures: useNavigationGestures(navigate),
    attachGestures: (element: HTMLElement, options?: any) => {
      const gestures = useTouchGestures(options);
      return gestures.attachGestures(element);
    }
  };
};

export default TouchGestureProvider;
