import { useEffect, useRef, useCallback } from 'react';
import { useMemoryLeakPrevention } from './useMemoryLeakPrevention';

// =====================================================
// HOOK PARA MANEJO DE EVENT LISTENERS SIN MEMORY LEAKS
// =====================================================

interface EventListenerConfig {
  event: string;
  handler: EventListener;
  element?: Element | Window | Document;
  options?: AddEventListenerOptions;
}

export const useTutorialEventListeners = () => {
  const { addEventListener, removeEventListener, cleanup } = useMemoryLeakPrevention();

  // Hook para manejar clicks fuera del tutorial
  const useClickOutside = useCallback((
    ref: React.RefObject<HTMLElement>,
    callback: () => void
  ) => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    addEventListener({
      event: 'mousedown',
      handler: handleClickOutside,
      element: document,
    });

    return () => {
      removeEventListener({
        event: 'mousedown',
        handler: handleClickOutside,
        element: document,
      });
    };
  }, [addEventListener, removeEventListener]);

  // Hook para manejar teclas de escape
  const useEscapeKey = useCallback((callback: () => void) => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    addEventListener({
      event: 'keydown',
      handler: handleEscape,
      element: document,
    });

    return () => {
      removeEventListener({
        event: 'keydown',
        handler: handleEscape,
        element: document,
      });
    };
  }, [addEventListener, removeEventListener]);

  // Hook para manejar resize
  const useResize = useCallback((callback: () => void) => {
    const handleResize = () => {
      callback();
    };

    addEventListener({
      event: 'resize',
      handler: handleResize,
      element: window,
    });

    return () => {
      removeEventListener({
        event: 'resize',
        handler: handleResize,
        element: window,
      });
    };
  }, [addEventListener, removeEventListener]);

  // Hook para manejar scroll
  const useScroll = useCallback((callback: () => void, element?: Element) => {
    const handleScroll = () => {
      callback();
    };

    addEventListener({
      event: 'scroll',
      handler: handleScroll,
      element: element || window,
    });

    return () => {
      removeEventListener({
        event: 'scroll',
        handler: handleScroll,
        element: element || window,
      });
    };
  }, [addEventListener, removeEventListener]);

  // Hook para manejar storage changes (sincronización entre pestañas)
  const useStorageSync = useCallback((callback: (event: StorageEvent) => void) => {
    const handleStorageChange = (event: StorageEvent) => {
      callback(event);
    };

    addEventListener({
      event: 'storage',
      handler: handleStorageChange,
      element: window,
    });

    return () => {
      removeEventListener({
        event: 'storage',
        handler: handleStorageChange,
        element: window,
      });
    };
  }, [addEventListener, removeEventListener]);

  // Hook para manejar visibility change (pestaña activa/inactiva)
  const useVisibilityChange = useCallback((callback: (isVisible: boolean) => void) => {
    const handleVisibilityChange = () => {
      callback(!document.hidden);
    };

    addEventListener({
      event: 'visibilitychange',
      handler: handleVisibilityChange,
      element: document,
    });

    return () => {
      removeEventListener({
        event: 'visibilitychange',
        handler: handleVisibilityChange,
        element: document,
      });
    };
  }, [addEventListener, removeEventListener]);

  return {
    addEventListener,
    removeEventListener,
    cleanup,
    useClickOutside,
    useEscapeKey,
    useResize,
    useScroll,
    useStorageSync,
    useVisibilityChange,
  };
};
