import React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useMemoryLeakPrevention } from './useMemoryLeakPrevention';

// =====================================================
// HOOK PARA LAZY LOADING OPTIMIZADO
// =====================================================

interface LazyLoadingOptions {
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
  delay?: number;
  fallback?: React.ReactNode;
  preload?: boolean;
}

interface LazyLoadingReturn {
  isVisible: boolean;
  isLoaded: boolean;
  ref: React.RefObject<HTMLElement>;
  load: () => void;
  unload: () => void;
}

export const useLazyLoading = (options: LazyLoadingOptions = {}): LazyLoadingReturn => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true,
    delay = 0,
    preload = false,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const { addTimeout, clearTimeout } = useMemoryLeakPrevention();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Intersection Observer
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Callback para el observer
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    
    if (entry.isIntersecting) {
      setIsVisible(true);
      
      if (delay > 0) {
        timeoutRef.current = addTimeout(() => {
          setIsLoaded(true);
        }, delay);
      } else {
        setIsLoaded(true);
      }
      
      // Si triggerOnce es true, desconectar el observer
      if (triggerOnce && observerRef.current) {
        observerRef.current.disconnect();
      }
    } else if (!triggerOnce) {
      setIsVisible(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [delay, triggerOnce, addTimeout, clearTimeout]);

  // Configurar observer
  useEffect(() => {
    if (!ref.current) return;

    // Crear observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold,
    });

    // Observar elemento
    observerRef.current.observe(ref.current);

    // Preload si está habilitado
    if (preload) {
      setIsLoaded(true);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleIntersection, rootMargin, threshold, preload]);

  // Funciones de control manual
  const load = useCallback(() => {
    setIsVisible(true);
    setIsLoaded(true);
  }, []);

  const unload = useCallback(() => {
    setIsVisible(false);
    setIsLoaded(false);
  }, []);

  return {
    isVisible,
    isLoaded,
    ref,
    load,
    unload,
  };
};

// Hook para lazy loading de imágenes
export const useLazyImage = (src: string, options: LazyLoadingOptions = {}) => {
  const { isVisible, isLoaded, ref } = useLazyLoading(options);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isLoaded && src) {
      setIsLoading(true);
      setHasError(false);
      
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
      };
      img.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };
      img.src = src;
    }
  }, [isLoaded, src]);

  return {
    isVisible,
    isLoaded,
    isLoading,
    hasError,
    imageSrc,
    ref,
  };
};

// Hook para lazy loading de componentes
export const useLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadingOptions = {}
) => {
  const { isVisible, isLoaded, ref } = useLazyLoading(options);
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isLoaded && !Component && !isLoading) {
      setIsLoading(true);
      setHasError(false);
      
      importFn()
        .then((module) => {
          setComponent(() => module.default);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error loading component:', error);
          setHasError(true);
          setIsLoading(false);
        });
    }
  }, [isLoaded, Component, isLoading, importFn]);

  return {
    isVisible,
    isLoaded,
    isLoading,
    hasError,
    Component,
    ref,
  };
};

// Hook para lazy loading de datos
export const useLazyData = <T>(
  fetchFn: () => Promise<T>,
  options: LazyLoadingOptions = {}
) => {
  const { isVisible, isLoaded, ref } = useLazyLoading(options);
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isLoaded && !data && !isLoading) {
      setIsLoading(true);
      setHasError(false);
      
      fetchFn()
        .then((result) => {
          setData(result);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error loading data:', error);
          setHasError(true);
          setIsLoading(false);
        });
    }
  }, [isLoaded, data, isLoading, fetchFn]);

  return {
    isVisible,
    isLoaded,
    isLoading,
    hasError,
    data,
    ref,
  };
};

// Hook para lazy loading de listas
export const useLazyList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  options: LazyLoadingOptions = {}
) => {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addEventListener, removeEventListener } = useMemoryLeakPrevention();

  // Calcular elementos visibles
  const calculateVisibleItems = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const newStartIndex = Math.floor(scrollTop / itemHeight);
    const newEndIndex = Math.min(
      newStartIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    setStartIndex(newStartIndex);
    setEndIndex(newEndIndex);
    setVisibleItems(items.slice(newStartIndex, newEndIndex));
  }, [items, itemHeight, containerHeight]);

  // Configurar scroll listener
  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      calculateVisibleItems();
    };

    addEventListener({
      event: 'scroll',
      handler: handleScroll,
      element: containerRef.current,
      options: { passive: true },
    });

    // Calcular inicialmente
    calculateVisibleItems();

    return () => {
      removeEventListener({
        event: 'scroll',
        handler: handleScroll,
        element: containerRef.current!,
        options: { passive: true },
      });
    };
  }, [calculateVisibleItems, addEventListener, removeEventListener]);

  // Recalcular cuando cambien los items
  useEffect(() => {
    calculateVisibleItems();
  }, [items, calculateVisibleItems]);

  return {
    visibleItems,
    startIndex,
    endIndex,
    containerRef,
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight,
  };
};

// Hook para lazy loading de rutas
export const useLazyRoute = (routePath: string, options: LazyLoadingOptions = {}) => {
  const { isVisible, isLoaded, ref } = useLazyLoading(options);
  const [RouteComponent, setRouteComponent] = useState<React.ComponentType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isLoaded && !RouteComponent && !isLoading) {
      setIsLoading(true);
      setHasError(false);
      
      // Importar componente de ruta
      import(`../pages/${routePath}`)
        .then((module) => {
          setRouteComponent(() => module.default);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error(`Error loading route ${routePath}:`, error);
          setHasError(true);
          setIsLoading(false);
        });
    }
  }, [isLoaded, RouteComponent, isLoading, routePath]);

  return {
    isVisible,
    isLoaded,
    isLoading,
    hasError,
    RouteComponent,
    ref,
  };
};

export default useLazyLoading;