import { useState, useEffect, useRef, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
  enableLRU?: boolean; // Enable Least Recently Used eviction
}

class IntelligentCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 100,
      enableLRU: options.enableLRU ?? true
    };
  }

  set(key: string, data: T, customTTL?: number): void {
    const ttl = customTTL || this.options.ttl;
    const now = Date.now();

    // Si el cache está lleno, eliminar el menos usado
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Verificar si ha expirado
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Actualizar estadísticas de acceso
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    const now = Date.now();
    
    // Verificar si ha expirado
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictLRU(): void {
    if (!this.options.enableLRU) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Métricas del cache
  getStats() {
    const now = Date.now();
    let totalAccesses = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      totalAccesses += entry.accessCount;
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      totalAccesses,
      expiredEntries,
      hitRate: totalAccesses > 0 ? (totalAccesses - expiredEntries) / totalAccesses : 0
    };
  }

  // Limpiar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Hook para usar el cache inteligente
export function useIntelligentCache<T>(
  options: CacheOptions = {}
) {
  const cacheRef = useRef<IntelligentCache<T>>();
  
  if (!cacheRef.current) {
    cacheRef.current = new IntelligentCache<T>(options);
  }

  const cache = cacheRef.current;

  // Limpiar cache periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      cache.cleanup();
    }, 60000); // Limpiar cada minuto

    return () => clearInterval(interval);
  }, [cache]);

  const set = useCallback((key: string, data: T, customTTL?: number) => {
    cache.set(key, data, customTTL);
  }, [cache]);

  const get = useCallback((key: string): T | null => {
    return cache.get(key);
  }, [cache]);

  const has = useCallback((key: string): boolean => {
    return cache.has(key);
  }, [cache]);

  const remove = useCallback((key: string): boolean => {
    return cache.delete(key);
  }, [cache]);

  const clear = useCallback(() => {
    cache.clear();
  }, [cache]);

  const getStats = useCallback(() => {
    return cache.getStats();
  }, [cache]);

  return {
    set,
    get,
    has,
    remove,
    clear,
    getStats
  };
}

// Hook para datos con cache automático
export function useCachedData<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    onError?: (error: Error) => void;
  } = {}
) {
  const { ttl = 5 * 60 * 1000, enabled = true, onError } = options;
  const cache = useIntelligentCache<T>();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Verificar cache primero
    const cachedData = cache.get(key);
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      cache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [key, fetchFunction, cache, ttl, enabled, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    cache.remove(key);
    fetchData();
  }, [cache, key, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    isCached: cache.has(key)
  };
}

// Hook para invalidar cache basado en dependencias
export function useCacheInvalidation() {
  const cache = useIntelligentCache();

  const invalidateByPattern = useCallback((pattern: string) => {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    // Nota: En una implementación real, necesitarías una forma de iterar sobre las claves
    // Por simplicidad, asumimos que tienes acceso a las claves
    return keysToDelete.length;
  }, [cache]);

  const invalidateAll = useCallback(() => {
    cache.clear();
  }, [cache]);

  return {
    invalidateByPattern,
    invalidateAll
  };
}
