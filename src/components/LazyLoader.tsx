import React, { Suspense, lazy, ComponentType, ReactNode } from 'react';
import { useLazyLoading, useLazyComponent, useLazyImage, useLazyData } from '@/hooks/useLazyLoading';
import { motion } from '@/components/OptimizedMotion';
import { Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';

// =====================================================
// COMPONENTES DE LAZY LOADING OPTIMIZADOS
// =====================================================

interface LazyLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
  delay?: number;
  className?: string;
}

// Componente principal de lazy loading
export const LazyLoader: React.FC<LazyLoaderProps> = ({
  children,
  fallback = <DefaultFallback />,
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true,
  delay = 0,
  className = '',
}) => {
  const { isVisible, isLoaded, ref } = useLazyLoading({
    rootMargin,
    threshold,
    triggerOnce,
    delay,
  });

  return (
    <div ref={ref} className={className}>
      {isLoaded ? (
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      ) : (
        fallback
      )}
    </div>
  );
};

// Componente para lazy loading de imágenes
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
  delay?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  fallback = <ImageFallback />,
  errorFallback = <ImageErrorFallback />,
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true,
  delay = 0,
  onLoad,
  onError,
}) => {
  const { isVisible, isLoaded, isLoading, hasError, imageSrc, ref } = useLazyImage(src, {
    rootMargin,
    threshold,
    triggerOnce,
    delay,
  });

  React.useEffect(() => {
    if (isLoaded && imageSrc) {
      onLoad?.();
    }
  }, [isLoaded, imageSrc, onLoad]);

  React.useEffect(() => {
    if (hasError) {
      onError?.();
    }
  }, [hasError, onError]);

  return (
    <div ref={ref} className={className}>
      {hasError ? (
        errorFallback
      ) : imageSrc ? (
        <motion.img
          src={imageSrc}
          alt={alt}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
          className="w-full h-full object-cover"
        />
      ) : (
        fallback
      )}
    </div>
  );
};

// Componente para lazy loading de componentes
interface LazyComponentProps<T extends ComponentType<any>> {
  importFn: () => Promise<{ default: T }>;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
  delay?: number;
  props?: React.ComponentProps<T>;
}

export const LazyComponent = <T extends ComponentType<any>>({
  importFn,
  fallback = <DefaultFallback />,
  errorFallback = <ErrorFallback />,
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true,
  delay = 0,
  props = {},
}: LazyComponentProps<T>) => {
  const { isVisible, isLoaded, isLoading, hasError, Component, ref } = useLazyComponent(importFn, {
    rootMargin,
    threshold,
    triggerOnce,
    delay,
  });

  return (
    <div ref={ref}>
      {hasError ? (
        errorFallback
      ) : Component ? (
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <Component {...props} />
        </motion.div>
      ) : (
        fallback
      )}
    </div>
  );
};

// Componente para lazy loading de datos
interface LazyDataProps<T> {
  fetchFn: () => Promise<T>;
  children: (data: T) => ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
  delay?: number;
}

export const LazyData = <T,>({
  fetchFn,
  children,
  fallback = <DefaultFallback />,
  errorFallback = <ErrorFallback />,
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true,
  delay = 0,
}: LazyDataProps<T>) => {
  const { isVisible, isLoaded, isLoading, hasError, data, ref } = useLazyData(fetchFn, {
    rootMargin,
    threshold,
    triggerOnce,
    delay,
  });

  return (
    <div ref={ref}>
      {hasError ? (
        errorFallback
      ) : data ? (
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          {children(data)}
        </motion.div>
      ) : (
        fallback
      )}
    </div>
  );
};

// Componente para lazy loading de listas
interface LazyListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
  delay?: number;
  className?: string;
}

export const LazyList = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  fallback = <DefaultFallback />,
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true,
  delay = 0,
  className = '',
}: LazyListProps<T>) => {
  const { isVisible, isLoaded, ref } = useLazyLoading({
    rootMargin,
    threshold,
    triggerOnce,
    delay,
  });

  const { visibleItems, startIndex, endIndex, containerRef, totalHeight, offsetY } = useLazyList(
    items,
    itemHeight,
    containerHeight,
    { rootMargin, threshold, triggerOnce, delay }
  );

  return (
    <div ref={ref} className={className}>
      {isLoaded ? (
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <div
            ref={containerRef}
            style={{ height: containerHeight, overflow: 'auto' }}
            className="relative"
          >
            <div style={{ height: totalHeight, position: 'relative' }}>
              <div style={{ transform: `translateY(${offsetY}px)` }}>
                {visibleItems.map((item, index) => (
                  <div
                    key={startIndex + index}
                    style={{ height: itemHeight }}
                    className="flex items-center"
                  >
                    {renderItem(item, startIndex + index)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        fallback
      )}
    </div>
  );
};

// Componentes de fallback
const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
    <span className="ml-2 text-sm text-gray-500">Cargando...</span>
  </div>
);

const ErrorFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <AlertCircle className="h-6 w-6 text-red-500" />
    <span className="ml-2 text-sm text-red-500">Error al cargar</span>
  </div>
);

const ImageFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
    <ImageIcon className="h-8 w-8 text-gray-400" />
  </div>
);

const ImageErrorFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8 bg-red-50 rounded-lg">
    <AlertCircle className="h-8 w-8 text-red-500" />
    <span className="ml-2 text-sm text-red-500">Error al cargar imagen</span>
  </div>
);

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

// Componente para lazy loading de rutas
interface LazyRouteProps {
  routePath: string;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
  delay?: number;
  props?: any;
}

export const LazyRoute: React.FC<LazyRouteProps> = ({
  routePath,
  fallback = <DefaultFallback />,
  errorFallback = <ErrorFallback />,
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true,
  delay = 0,
  props = {},
}) => {
  const { isVisible, isLoaded, isLoading, hasError, RouteComponent, ref } = useLazyRoute(routePath, {
    rootMargin,
    threshold,
    triggerOnce,
    delay,
  });

  return (
    <div ref={ref}>
      {hasError ? (
        errorFallback
      ) : RouteComponent ? (
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <RouteComponent {...props} />
        </motion.div>
      ) : (
        fallback
      )}
    </div>
  );
};

export default LazyLoader;
