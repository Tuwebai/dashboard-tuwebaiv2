// =====================================================
// SISTEMA DE CACHE INTELIGENTE
// =====================================================

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live en milisegundos
  maxSize?: number; // Tamaño máximo del cache
  maxAge?: number; // Edad máxima en milisegundos
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutos por defecto
      maxSize: options.maxSize || 100, // 100 items por defecto
      maxAge: options.maxAge || 30 * 60 * 1000, // 30 minutos por defecto
    };
  }

  // Obtener item del cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Actualizar estadísticas de acceso
    item.accessCount++;
    item.lastAccessed = Date.now();

    return item.data;
  }

  // Guardar item en el cache
  set<T>(key: string, data: T, customTtl?: number): void {
    const now = Date.now();
    const ttl = customTtl || this.options.ttl;

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      accessCount: 0,
      lastAccessed: now,
    };

    this.cache.set(key, item);

    // Limpiar cache si excede el tamaño máximo
    this.cleanup();
  }

  // Verificar si existe un item
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    // Verificar si ha expirado
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Eliminar item del cache
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Limpiar todo el cache
  clear(): void {
    this.cache.clear();
  }

  // Obtener estadísticas del cache
  getStats() {
    const now = Date.now();
    const items = Array.from(this.cache.values());
    
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: this.calculateHitRate(),
      oldestItem: Math.min(...items.map(item => item.timestamp)),
      newestItem: Math.max(...items.map(item => item.timestamp)),
      totalAccesses: items.reduce((sum, item) => sum + item.accessCount, 0),
      expiredItems: items.filter(item => now > item.expiresAt).length,
    };
  }

  // Limpiar items expirados y excedentes
  private cleanup(): void {
    const now = Date.now();
    
    // Eliminar items expirados
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt || (now - item.timestamp) > this.options.maxAge) {
        this.cache.delete(key);
      }
    }

    // Si aún excede el tamaño máximo, eliminar los menos accedidos
    if (this.cache.size > this.options.maxSize) {
      const items = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.accessCount - b.accessCount);
      
      const toDelete = items.slice(0, this.cache.size - this.options.maxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Calcular tasa de aciertos
  private calculateHitRate(): number {
    const items = Array.from(this.cache.values());
    const totalAccesses = items.reduce((sum, item) => sum + item.accessCount, 0);
    return totalAccesses > 0 ? totalAccesses / items.length : 0;
  }
}

// Instancias de cache para diferentes propósitos
export const tutorialCache = new CacheManager({
  ttl: 10 * 60 * 1000, // 10 minutos para tutoriales
  maxSize: 50,
});

export const helpContentCache = new CacheManager({
  ttl: 30 * 60 * 1000, // 30 minutos para contenido de ayuda
  maxSize: 100,
});

export const userPreferencesCache = new CacheManager({
  ttl: 60 * 60 * 1000, // 1 hora para preferencias de usuario
  maxSize: 20,
});

// Hook para usar cache en React
export const useCache = <T>(
  cache: CacheManager,
  key: string,
  fetchFn: () => Promise<T>,
  options?: CacheOptions
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // Intentar obtener del cache primero
      const cachedData = cache.get<T>(key);
      if (cachedData) {
        setData(cachedData);
        return;
      }

      // Si no está en cache, cargar
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchFn();
        cache.set(key, result, options?.ttl);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [cache, key, fetchFn, options?.ttl]);

  const invalidate = useCallback(() => {
    cache.delete(key);
    setData(null);
  }, [cache, key]);

  const refresh = useCallback(async () => {
    cache.delete(key);
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      cache.set(key, result, options?.ttl);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [cache, key, fetchFn, options?.ttl]);

  return {
    data,
    isLoading,
    error,
    invalidate,
    refresh,
  };
};

// Cache con IndexedDB para persistencia
export class PersistentCacheManager extends CacheManager {
  private dbName = 'TutorialCacheDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  async set<T>(key: string, data: T, customTtl?: number): Promise<void> {
    super.set(key, data, customTtl);
    
    if (this.db) {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const item = this.cache.get(key);
      
      if (item) {
        store.put({ key, ...item });
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Intentar obtener de memoria primero
    const memoryData = super.get<T>(key);
    if (memoryData) {
      return memoryData;
    }

    // Si no está en memoria, intentar obtener de IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        const request = store.get(key);

        return new Promise((resolve) => {
          request.onsuccess = () => {
            const result = request.result;
            if (result) {
              const item: CacheItem<T> = {
                data: result.data,
                timestamp: result.timestamp,
                expiresAt: result.expiresAt,
                accessCount: result.accessCount,
                lastAccessed: result.lastAccessed,
              };

              // Verificar si ha expirado
              if (Date.now() > item.expiresAt) {
                this.delete(key);
                resolve(null);
              } else {
                // Cargar en memoria
                this.cache.set(key, item);
                resolve(item.data);
              }
            } else {
              resolve(null);
            }
          };

          request.onerror = () => resolve(null);
        });
      } catch (error) {
        console.error('Error reading from IndexedDB:', error);
        return null;
      }
    }

    return null;
  }
}

// Instancia de cache persistente
export const persistentCache = new PersistentCacheManager({
  ttl: 24 * 60 * 60 * 1000, // 24 horas para cache persistente
  maxSize: 200,
});
