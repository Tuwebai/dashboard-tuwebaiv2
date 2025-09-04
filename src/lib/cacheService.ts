interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en milisegundos
}

interface CacheOptions {
  ttl?: number; // Tiempo de vida por defecto (5 minutos)
  maxSize?: number; // Tamaño máximo del cache (100 items)
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos
  private maxSize = 100;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || this.defaultTTL;
    this.maxSize = options.maxSize || this.maxSize;
  }

  // Obtener item del cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verificar si el item ha expirado
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // Guardar item en el cache
  set<T>(key: string, data: T, ttl?: number): void {
    // Limpiar cache si está lleno
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, item);
  }

  // Eliminar item del cache
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Limpiar cache expirado
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Limpiar todo el cache
  clear(): void {
    this.cache.clear();
  }

  // Obtener estadísticas del cache
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const item of this.cache.values()) {
      if (now - item.timestamp > item.ttl) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      maxSize: this.maxSize
    };
  }

  // Verificar si existe una clave
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// Cache para datos de usuario
export const userCache = new CacheService({ ttl: 10 * 60 * 1000 }); // 10 minutos

// Cache para proyectos
export const projectCache = new CacheService({ ttl: 5 * 60 * 1000 }); // 5 minutos

// Cache para analytics
export const analyticsCache = new CacheService({ ttl: 15 * 60 * 1000 }); // 15 minutos

// Cache para configuraciones
export const configCache = new CacheService({ ttl: 30 * 60 * 1000 }); // 30 minutos

// Cache para imágenes y assets
export const assetCache = new CacheService({ ttl: 60 * 60 * 1000 }); // 1 hora

// Función helper para generar claves de cache
export const generateCacheKey = (prefix: string, ...params: any[]): string => {
  return `${prefix}:${params.map(p => String(p)).join(':')}`;
};

// Función helper para cache con async
export const withCache = async <T>(
  cache: CacheService,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // Intentar obtener del cache
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Si no está en cache, obtener datos
  const data = await fetcher();
  
  // Guardar en cache
  cache.set(key, data, ttl);
  
  return data;
};

// Función para invalidar cache por patrón
export const invalidateCacheByPattern = (cache: CacheService, pattern: string): void => {
  const keys = Array.from(cache['cache'].keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
};

// Función para precargar datos importantes
export const preloadCriticalData = async (): Promise<void> => {
  try {
    // Preload user data
    const userKey = generateCacheKey('user', 'current');
    if (!userCache.has(userKey)) {
      // Aquí se cargarían los datos del usuario actual
              // Precargando datos del usuario
    }

    // Preload config
    const configKey = generateCacheKey('config', 'app');
    if (!configCache.has(configKey)) {
      // Aquí se cargarían las configuraciones de la app
              // Precargando configuraciones
    }
  } catch (error) {
    console.error('Error precargando datos críticos:', error);
  }
};

// Función para limpiar cache periódicamente
export const startCacheCleanup = (interval: number = 5 * 60 * 1000): NodeJS.Timeout => {
  return setInterval(() => {
    userCache.cleanup();
    projectCache.cleanup();
    analyticsCache.cleanup();
    configCache.cleanup();
    assetCache.cleanup();
    
          // Cache cleanup completed
  }, interval);
};

export default CacheService; 
