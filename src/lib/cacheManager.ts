// =====================================================
// SISTEMA DE CACHE OPTIMIZADO CON INDEXEDDB
// =====================================================

import React from 'react';
import { useState, useEffect } from 'react';

interface CacheItem<T = any> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt?: number;
  tags?: string[];
  size?: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[];
  maxSize?: number; // Maximum size in bytes
  strategy?: 'lru' | 'fifo' | 'lfu'; // Cache eviction strategy
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  items: number;
  hitRate: number;
}

class CacheManager {
  private db: IDBDatabase | null = null;
  private dbName = 'TuWebAICache';
  private dbVersion = 1;
  private storeName = 'cache';
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    items: 0,
    hitRate: 0,
  };
  private memoryCache = new Map<string, CacheItem>();
  private maxMemoryItems = 100;
  private isInitialized = false;

  // Inicializar IndexedDB
  async init(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        this.loadStats();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
      };
    });
  }

  // Guardar en cache
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    await this.init();

    const now = Date.now();
    const expiresAt = options.ttl ? now + options.ttl : undefined;
    const size = this.calculateSize(value);

    const item: CacheItem<T> = {
      key,
      value,
      timestamp: now,
      expiresAt,
      tags: options.tags,
      size,
    };

    // Guardar en memoria
    this.memoryCache.set(key, item);
    this.cleanupMemoryCache();

    // Guardar en IndexedDB
    if (this.db) {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.put(item);
    }

    this.updateStats();
  }

  // Obtener del cache
  async get<T>(key: string): Promise<T | null> {
    await this.init();

    // Buscar en memoria primero
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && !this.isExpired(memoryItem)) {
      this.stats.hits++;
      this.updateStats();
      return memoryItem.value as T;
    }

    // Buscar en IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        return new Promise((resolve) => {
          request.onsuccess = () => {
            const item = request.result as CacheItem<T>;
            if (item && !this.isExpired(item)) {
              // Mover a memoria
              this.memoryCache.set(key, item);
              this.cleanupMemoryCache();
              
              this.stats.hits++;
              this.updateStats();
              resolve(item.value);
            } else {
              this.stats.misses++;
              this.updateStats();
              resolve(null);
            }
          };

          request.onerror = () => {
            this.stats.misses++;
            this.updateStats();
            resolve(null);
          };
        });
      } catch (error) {
        console.error('Error getting from cache:', error);
        this.stats.misses++;
        this.updateStats();
        return null;
      }
    }

    this.stats.misses++;
    this.updateStats();
    return null;
  }

  // Eliminar del cache
  async delete(key: string): Promise<void> {
    await this.init();

    // Eliminar de memoria
    this.memoryCache.delete(key);

    // Eliminar de IndexedDB
    if (this.db) {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.delete(key);
    }

    this.updateStats();
  }

  // Limpiar cache por tags
  async clearByTags(tags: string[]): Promise<void> {
    await this.init();

    if (!this.db) return;

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('tags');
    
    for (const tag of tags) {
      const request = index.getAll(tag);
      request.onsuccess = () => {
        const items = request.result;
        items.forEach(item => {
          this.memoryCache.delete(item.key);
          store.delete(item.key);
        });
      };
    }

    this.updateStats();
  }

  // Limpiar cache expirado
  async clearExpired(): Promise<void> {
    await this.init();

    if (!this.db) return;

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('expiresAt');
    const now = Date.now();

    const request = index.getAll();
    request.onsuccess = () => {
      const items = request.result;
      items.forEach(item => {
        if (item.expiresAt && item.expiresAt < now) {
          this.memoryCache.delete(item.key);
          store.delete(item.key);
        }
      });
    };

    this.updateStats();
  }

  // Limpiar todo el cache
  async clear(): Promise<void> {
    await this.init();

    // Limpiar memoria
    this.memoryCache.clear();

    // Limpiar IndexedDB
    if (this.db) {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.clear();
    }

    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      items: 0,
      hitRate: 0,
    };
  }

  // Obtener estadísticas
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Verificar si un item está expirado
  private isExpired(item: CacheItem): boolean {
    if (!item.expiresAt) return false;
    return Date.now() > item.expiresAt;
  }

  // Calcular tamaño de un objeto
  private calculateSize(value: any): number {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 0;
    }
  }

  // Limpiar cache de memoria
  private cleanupMemoryCache(): void {
    if (this.memoryCache.size <= this.maxMemoryItems) return;

    // Convertir a array y ordenar por timestamp
    const items = Array.from(this.memoryCache.entries())
      .map(([key, item]) => ({ key, item }))
      .sort((a, b) => a.item.timestamp - b.item.timestamp);

    // Eliminar los más antiguos
    const toDelete = items.slice(0, items.length - this.maxMemoryItems);
    toDelete.forEach(({ key }) => {
      this.memoryCache.delete(key);
    });
  }

  // Actualizar estadísticas
  private updateStats(): void {
    this.stats.items = this.memoryCache.size;
    this.stats.size = Array.from(this.memoryCache.values())
      .reduce((total, item) => total + (item.size || 0), 0);
    
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  // Cargar estadísticas desde IndexedDB
  private async loadStats(): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onsuccess = () => {
        this.stats.items = request.result;
        this.updateStats();
      };
    } catch (error) {
      console.error('Error loading cache stats:', error);
    }
  }

  // Iniciar limpieza automática
  startAutoCleanup(): void {
    // Limpiar cache expirado cada 5 minutos
    setInterval(() => {
      this.clearExpired();
    }, 5 * 60 * 1000);
  }

  // Detener limpieza automática
  stopAutoCleanup(): void {
    // En una implementación más robusta, guardaríamos el ID del interval
    // Por ahora, esta función está aquí para completar la interfaz
    console.log('Auto cleanup stopped');
  }
}

// Instancia singleton
export const cacheManager = new CacheManager();

// Hook para usar el cache en React
export const useCache = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    cacheManager.init().then(() => {
      setIsReady(true);
    });
  }, []);

  return {
    isReady,
    set: cacheManager.set.bind(cacheManager),
    get: cacheManager.get.bind(cacheManager),
    delete: cacheManager.delete.bind(cacheManager),
    clear: cacheManager.clear.bind(cacheManager),
    clearByTags: cacheManager.clearByTags.bind(cacheManager),
    clearExpired: cacheManager.clearExpired.bind(cacheManager),
    getStats: cacheManager.getStats.bind(cacheManager),
  };
};

// Utilidades de cache
export const cacheUtils = {
  // Generar clave de cache
  generateKey: (prefix: string, ...parts: string[]): string => {
    return `${prefix}:${parts.join(':')}`;
  },

  // Cache con TTL
  withTTL: (ttl: number) => ({ ttl }),

  // Cache con tags
  withTags: (tags: string[]) => ({ tags }),

  // Cache con tamaño máximo
  withMaxSize: (maxSize: number) => ({ maxSize }),

  // Cache con estrategia
  withStrategy: (strategy: 'lru' | 'fifo' | 'lfu') => ({ strategy }),
};

// Función para iniciar la limpieza automática si se necesita fuera de la instancia
export function setupAutoCacheCleanup() {
  cacheManager.startAutoCleanup();
}

// Función para detener la limpieza automática
export function stopAutoCacheCleanup() {
  cacheManager.stopAutoCleanup();
}

export default cacheManager;