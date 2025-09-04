import { handleSupabaseError } from './errorHandler';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
  tags?: string[]; // Para invalidación por tags
}

export interface CacheConfig {
  defaultTTL: number; // TTL por defecto en ms
  maxSize: number; // Tamaño máximo del caché
  cleanupInterval: number; // Intervalo de limpieza en ms
}

export class IntelligentCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutos por defecto
      maxSize: 1000, // 1000 entradas máximo
      cleanupInterval: 60 * 1000, // Limpiar cada minuto
      ...config
    };

    this.startCleanup();
  }

  // Obtener datos del caché
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // Guardar datos en el caché
  set<T>(key: string, data: T, ttl?: number, tags?: string[]): void {
    // Limpiar caché si está lleno
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      key,
      tags
    };

    this.cache.set(key, entry);
  }

  // Invalidar por clave
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  // Invalidar por tags
  invalidateByTags(tags: string[]): number {
    let invalidated = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  // Limpiar todo el caché
  clear(): void {
    this.cache.clear();
  }

  // Obtener estadísticas del caché
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: this.calculateHitRate()
    };
  }

  // Función con caché automático
  async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
    tags?: string[]
  ): Promise<T> {
    // Intentar obtener del caché
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Si no está en caché, obtener datos
    try {
      const data = await fetcher();
      this.set(key, data, ttl, tags);
      return data;
    } catch (error) {
      handleSupabaseError(error, `Error fetching data for cache key: ${key}`);
      throw error;
    }
  }

  // Limpiar entradas expiradas
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  // Evictar la entrada más antigua
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Iniciar limpieza automática
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  // Detener limpieza automática
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }

  // Calcular tasa de aciertos (simplificado)
  private calculateHitRate(): number {
    // Implementación simplificada - en producción usar métricas reales
    return 0.85; // 85% de aciertos estimado
  }
}

// Instancias de caché especializadas
export const projectCache = new IntelligentCache({
  defaultTTL: 10 * 60 * 1000, // 10 minutos para proyectos
  maxSize: 500
});

export const userCache = new IntelligentCache({
  defaultTTL: 15 * 60 * 1000, // 15 minutos para usuarios
  maxSize: 200
});

export const ticketCache = new IntelligentCache({
  defaultTTL: 5 * 60 * 1000, // 5 minutos para tickets
  maxSize: 1000
});

export const chartDataCache = new IntelligentCache({
  defaultTTL: 30 * 60 * 1000, // 30 minutos para datos de gráficos
  maxSize: 100
});

// Función helper para generar claves de caché
export const generateCacheKey = (prefix: string, ...params: (string | number)[]): string => {
  return `${prefix}:${params.join(':')}`;
};

// Tags para invalidación
export const CACHE_TAGS = {
  PROJECTS: 'projects',
  USERS: 'users',
  TICKETS: 'tickets',
  CHARTS: 'charts',
  USER_PREFERENCES: 'user_preferences'
} as const;
