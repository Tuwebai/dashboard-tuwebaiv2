// =====================================================
// HOOK PARA LAZY LOADING DE COMPONENTES OPTIMIZADO
// =====================================================

import { lazy, Suspense, ComponentType } from 'react';
import { useLazyLoading } from './useLazyLoading';

interface LazyComponentOptions {
  fallback?: ComponentType;
  preload?: boolean;
  threshold?: number;
  rootMargin?: string;
}

// Componente de fallback por defecto
const DefaultFallback = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Hook para lazy loading de componentes
export const useLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
) => {
  const {
    fallback: Fallback = DefaultFallback,
    preload = false,
    threshold = 0.1,
    rootMargin = '50px'
  } = options;

  // Crear componente lazy
  const LazyComponent = lazy(importFn);

  // Hook de lazy loading
  const { isVisible, ref } = useLazyLoading({
    threshold,
    rootMargin
  });

  // Preload del componente si está habilitado
  if (preload && !isVisible) {
    importFn().catch(console.error);
  }

  // Componente wrapper con Suspense
  const WrappedComponent = (props: any) => (
    <div ref={ref}>
      {isVisible ? (
        <Suspense fallback={<Fallback />}>
          <LazyComponent {...props} />
        </Suspense>
      ) : (
        <Fallback />
      )}
    </div>
  );

  return {
    Component: WrappedComponent,
    isVisible,
    ref
  };
};

// Hook para preload de componentes
export const usePreloadComponent = () => {
  const preload = (importFn: () => Promise<any>) => {
    // Preload en el siguiente tick para no bloquear el render
    setTimeout(() => {
      importFn().catch(console.error);
    }, 0);
  };

  return { preload };
};

// Hook para lazy loading de múltiples componentes
export const useLazyComponents = <T extends Record<string, ComponentType<any>>>(
  importFns: Record<keyof T, () => Promise<{ default: T[keyof T] }>>,
  options: LazyComponentOptions = {}
) => {
  const components: Record<keyof T, any> = {} as any;

  Object.keys(importFns).forEach(key => {
    const importFn = importFns[key as keyof T];
    components[key as keyof T] = useLazyComponent(importFn, options);
  });

  return components;
};

export default useLazyComponent;
