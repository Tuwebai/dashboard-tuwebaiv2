// =====================================================
// UTILIDADES PARA OPTIMIZACIÓN DE BUNDLE
// =====================================================

// Lazy loading de componentes pesados
export const lazyLoadComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  return React.lazy(importFunc);
};

// Preload de componentes críticos
export const preloadComponent = (importFunc: () => Promise<any>) => {
  return importFunc();
};

// Tree shaking de iconos
export const importIcon = async (iconName: string) => {
  const { [iconName]: Icon } = await import('lucide-react');
  return Icon;
};

// Lazy loading de iconos específicos
export const lazyLoadIcon = (iconName: string) => {
  return React.lazy(async () => {
    const Icon = await importIcon(iconName);
    return { default: Icon };
  });
};

// Optimización de imports dinámicos
export const dynamicImport = async (modulePath: string) => {
  try {
    const module = await import(modulePath);
    return module.default || module;
  } catch (error) {
    console.error(`Error loading module ${modulePath}:`, error);
    return null;
  }
};

// Bundle analyzer helper
export const analyzeBundle = () => {
  if (process.env.NODE_ENV === 'development') {
    // Solo en desarrollo para análisis
    return {
      getBundleSize: () => {
        const scripts = document.querySelectorAll('script[src]');
        let totalSize = 0;
        
        scripts.forEach(script => {
          const src = script.getAttribute('src');
          if (src && src.includes('assets')) {
            // Estimación básica del tamaño
            totalSize += 100; // KB estimado
          }
        });
        
        return totalSize;
      },
      getLoadedModules: () => {
        return Object.keys((window as any).__webpack_require__.cache || {});
      }
    };
  }
  return null;
};

// Optimización de imágenes
export const optimizeImageLoading = (src: string, options: {
  lazy?: boolean;
  placeholder?: string;
  quality?: number;
} = {}) => {
  const { lazy = true, placeholder, quality = 80 } = options;
  
  return {
    src,
    loading: lazy ? 'lazy' : 'eager',
    placeholder: placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4=',
    quality,
  };
};

// Compresión de datos
export const compressData = (data: any): string => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error compressing data:', error);
    return '';
  }
};

export const decompressData = (compressedData: string): any => {
  try {
    return JSON.parse(compressedData);
  } catch (error) {
    console.error('Error decompressing data:', error);
    return null;
  }
};

// Memoización de funciones pesadas
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limpiar cache si es muy grande
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
};

// Debounce para funciones costosas
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle para funciones que se ejecutan frecuentemente
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
