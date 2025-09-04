import { useEffect, useRef, useCallback } from 'react';

// =====================================================
// HOOK PARA PREVENIR MEMORY LEAKS
// =====================================================

interface EventListenerConfig {
  event: string;
  handler: EventListener;
  element?: Element | Window | Document;
  options?: boolean | AddEventListenerOptions;
}

interface TimeoutConfig {
  id: NodeJS.Timeout;
  type: 'timeout' | 'interval';
}

export const useMemoryLeakPrevention = () => {
  const eventListenersRef = useRef<EventListenerConfig[]>([]);
  const timeoutsRef = useRef<TimeoutConfig[]>([]);
  const isMountedRef = useRef(true);

  // Agregar event listener con cleanup automático
  const addEventListener = useCallback((config: EventListenerConfig) => {
    if (!isMountedRef.current) return;

    const { event, handler, element = window, options } = config;
    
    element.addEventListener(event, handler, options);
    
    // Guardar referencia para limpieza
    eventListenersRef.current.push({
      event,
      handler,
      element,
      options,
    });
  }, []);

  // Remover event listener específico
  const removeEventListener = useCallback((config: EventListenerConfig) => {
    const { event, handler, element = window, options } = config;
    
    element.removeEventListener(event, handler, options);
    
    // Remover de la lista
    eventListenersRef.current = eventListenersRef.current.filter(
      listener => !(
        listener.event === event &&
        listener.handler === handler &&
        listener.element === element
      )
    );
  }, []);

  // Agregar timeout con cleanup automático
  const addTimeout = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    if (!isMountedRef.current) return null as any;

    const id = setTimeout(() => {
      if (isMountedRef.current) {
        callback();
      }
      // Remover de la lista después de ejecutar
      timeoutsRef.current = timeoutsRef.current.filter(t => t.id !== id);
    }, delay);

    timeoutsRef.current.push({ id, type: 'timeout' });
    return id;
  }, []);

  // Agregar interval con cleanup automático
  const addInterval = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    if (!isMountedRef.current) return null as any;

    const id = setInterval(() => {
      if (isMountedRef.current) {
        callback();
      }
    }, delay);

    timeoutsRef.current.push({ id, type: 'interval' });
    return id;
  }, []);

  // Limpiar timeout específico
  const clearTimeout = useCallback((id: NodeJS.Timeout) => {
    if (id) {
      global.clearTimeout(id);
      timeoutsRef.current = timeoutsRef.current.filter(t => t.id !== id);
    }
  }, []);

  // Limpiar interval específico
  const clearInterval = useCallback((id: NodeJS.Timeout) => {
    if (id) {
      global.clearInterval(id);
      timeoutsRef.current = timeoutsRef.current.filter(t => t.id !== id);
    }
  }, []);

  // Limpiar todos los event listeners
  const cleanupEventListeners = useCallback(() => {
    eventListenersRef.current.forEach(({ event, handler, element, options }) => {
      element.removeEventListener(event, handler, options);
    });
    eventListenersRef.current = [];
  }, []);

  // Limpiar todos los timeouts e intervals
  const cleanupTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(({ id, type }) => {
      if (type === 'timeout') {
        global.clearTimeout(id);
      } else {
        global.clearInterval(id);
      }
    });
    timeoutsRef.current = [];
  }, []);

  // Limpiar todo
  const cleanup = useCallback(() => {
    cleanupEventListeners();
    cleanupTimeouts();
  }, [cleanupEventListeners, cleanupTimeouts]);

  // Limpiar al desmontar
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    addEventListener,
    removeEventListener,
    addTimeout,
    addInterval,
    clearTimeout,
    clearInterval,
    cleanupEventListeners,
    cleanupTimeouts,
    cleanup,
    isMounted: isMountedRef.current,
  };
};

// Hook específico para event listeners
export const useEventListeners = () => {
  const { addEventListener, removeEventListener, cleanupEventListeners } = useMemoryLeakPrevention();
  
  return {
    addEventListener,
    removeEventListener,
    cleanupEventListeners,
  };
};

// Hook específico para timeouts e intervals
export const useTimers = () => {
  const { addTimeout, addInterval, clearTimeout, clearInterval, cleanupTimeouts } = useMemoryLeakPrevention();
  
  return {
    addTimeout,
    addInterval,
    clearTimeout,
    clearInterval,
    cleanupTimeouts,
  };
};

// Hook para resize events
export const useResizeListener = (callback: () => void, deps: any[] = []) => {
  const { addEventListener, removeEventListener } = useEventListeners();
  
  useEffect(() => {
    const handler = () => {
      if (typeof callback === 'function') {
        callback();
      }
    };

    addEventListener({
      event: 'resize',
      handler,
      element: window,
    });

    return () => {
      removeEventListener({
        event: 'resize',
        handler,
        element: window,
      });
    };
  }, deps);
};

// Hook para scroll events
export const useScrollListener = (callback: () => void, element: Element | Window = window, deps: any[] = []) => {
  const { addEventListener, removeEventListener } = useEventListeners();
  
  useEffect(() => {
    const handler = () => {
      if (typeof callback === 'function') {
        callback();
      }
    };

    addEventListener({
      event: 'scroll',
      handler,
      element,
      options: { passive: true },
    });

    return () => {
      removeEventListener({
        event: 'scroll',
        handler,
        element,
        options: { passive: true },
      });
    };
  }, deps);
};

// Hook para keyboard events
export const useKeyboardListener = (callback: (e: KeyboardEvent) => void, deps: any[] = []) => {
  const { addEventListener, removeEventListener } = useEventListeners();
  
  useEffect(() => {
    const handler = (e: Event) => {
      if (typeof callback === 'function') {
        callback(e as KeyboardEvent);
      }
    };

    addEventListener({
      event: 'keydown',
      handler,
      element: document,
    });

    return () => {
      removeEventListener({
        event: 'keydown',
        handler,
        element: document,
      });
    };
  }, deps);
};

// Hook para mouse events
export const useMouseListener = (callback: (e: MouseEvent) => void, event: 'mousemove' | 'mousedown' | 'mouseup' = 'mousemove', deps: any[] = []) => {
  const { addEventListener, removeEventListener } = useEventListeners();
  
  useEffect(() => {
    const handler = (e: Event) => {
      if (typeof callback === 'function') {
        callback(e as MouseEvent);
      }
    };

    addEventListener({
      event,
      handler,
      element: document,
    });

    return () => {
      removeEventListener({
        event,
        handler,
        element: document,
      });
    };
  }, deps);
};

export default useMemoryLeakPrevention;
