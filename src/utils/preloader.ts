// =====================================================
// SISTEMA DE PRELOADING ESTRATÉGICO
// =====================================================

interface PreloadResource {
  href: string;
  as: 'script' | 'style' | 'image' | 'font' | 'fetch' | 'document';
  crossorigin?: 'anonymous' | 'use-credentials';
  type?: string;
  media?: string;
  importance?: 'high' | 'low' | 'auto';
}

interface PreloadOptions {
  priority?: 'high' | 'medium' | 'low';
  timeout?: number;
  retries?: number;
  onSuccess?: (resource: PreloadResource) => void;
  onError?: (resource: PreloadResource, error: Error) => void;
}

class PreloadManager {
  private preloadedResources = new Set<string>();
  private preloadQueue: Array<{ resource: PreloadResource; options: PreloadOptions }> = [];
  private isProcessing = false;

  // Preload de recursos críticos
  async preloadCriticalResources(): Promise<void> {
    const criticalResources: PreloadResource[] = [
      // Fuentes críticas
      {
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        as: 'style',
        importance: 'high'
      },
      // Imágenes críticas
      {
        href: '/logoweb.jpg',
        as: 'image',
        importance: 'high'
      },
      {
        href: '/favicon.ico',
        as: 'image',
        importance: 'high'
      }
    ];

    await this.preloadResources(criticalResources, { priority: 'high' });
  }

  // Preload de rutas específicas
  async preloadRoute(route: string): Promise<void> {
    const routeResources: PreloadResource[] = [
      {
        href: route,
        as: 'document',
        importance: 'high'
      }
    ];

    await this.preloadResources(routeResources, { priority: 'high' });
  }

  // Preload de componentes
  async preloadComponent(componentPath: string): Promise<void> {
    const componentResource: PreloadResource = {
      href: componentPath,
      as: 'script',
      importance: 'medium'
    };

    await this.preloadResources([componentResource], { priority: 'medium' });
  }

  // Preload de imágenes
  async preloadImages(imageUrls: string[], priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    const imageResources: PreloadResource[] = imageUrls.map(url => ({
      href: url,
      as: 'image',
      importance: priority === 'high' ? 'high' : 'auto'
    }));

    await this.preloadResources(imageResources, { priority });
  }

  // Preload de fuentes
  async preloadFonts(fontUrls: string[]): Promise<void> {
    const fontResources: PreloadResource[] = fontUrls.map(url => ({
      href: url,
      as: 'font',
      crossorigin: 'anonymous'
    }));

    await this.preloadResources(fontResources, { priority: 'high' });
  }

  // Preload de scripts
  async preloadScripts(scriptUrls: string[], priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    const scriptResources: PreloadResource[] = scriptUrls.map(url => ({
      href: url,
      as: 'script',
      importance: priority === 'high' ? 'high' : 'auto'
    }));

    await this.preloadResources(scriptResources, { priority });
  }

  // Método principal de preload
  private async preloadResources(
    resources: PreloadResource[],
    options: PreloadOptions = {}
  ): Promise<void> {
    const { priority = 'medium', timeout = 10000, retries = 3 } = options;

    // Agregar a la cola de preload
    resources.forEach(resource => {
      if (!this.preloadedResources.has(resource.href)) {
        this.preloadQueue.push({ resource, options: { priority, timeout, retries } });
      }
    });

    // Procesar cola si no está en proceso
    if (!this.isProcessing) {
      await this.processPreloadQueue();
    }
  }

  // Procesar cola de preload
  private async processPreloadQueue(): Promise<void> {
    if (this.isProcessing || this.preloadQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    // Ordenar por prioridad
    this.preloadQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.options.priority || 'medium'] - priorityOrder[a.options.priority || 'medium'];
    });

    // Procesar en lotes para no sobrecargar
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < this.preloadQueue.length; i += batchSize) {
      batches.push(this.preloadQueue.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(({ resource, options }) => this.preloadSingleResource(resource, options))
      );
      
      // Pequeña pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.preloadQueue = [];
    this.isProcessing = false;
  }

  // Preload de un recurso individual
  private async preloadSingleResource(
    resource: PreloadResource,
    options: PreloadOptions
  ): Promise<void> {
    const { timeout = 10000, retries = 3, onSuccess, onError } = options;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await this.createPreloadLink(resource, timeout);
        this.preloadedResources.add(resource.href);
        onSuccess?.(resource);
        return;
      } catch (error) {
        if (attempt === retries - 1) {
          onError?.(resource, error as Error);
        } else {
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
  }

  // Crear link de preload
  private createPreloadLink(resource: PreloadResource, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;

      if (resource.crossorigin) {
        link.crossOrigin = resource.crossorigin;
      }

      if (resource.type) {
        link.type = resource.type;
      }

      if (resource.media) {
        link.media = resource.media;
      }

      if (resource.importance) {
        (link as any).importance = resource.importance;
      }

      // Timeout
      const timeoutId = setTimeout(() => {
        document.head.removeChild(link);
        reject(new Error(`Preload timeout for ${resource.href}`));
      }, timeout);

      // Event listeners
      link.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      link.onerror = () => {
        clearTimeout(timeoutId);
        document.head.removeChild(link);
        reject(new Error(`Failed to preload ${resource.href}`));
      };

      // Agregar al DOM
      document.head.appendChild(link);
    });
  }

  // Preload inteligente basado en interacción del usuario
  preloadOnHover(element: HTMLElement, resources: PreloadResource[]): void {
    let hasPreloaded = false;

    const handleMouseEnter = () => {
      if (!hasPreloaded) {
        hasPreloaded = true;
        this.preloadResources(resources, { priority: 'medium' });
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter, { once: true });
  }

  // Preload inteligente basado en scroll
  preloadOnScroll(threshold: number = 0.8): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const preloadData = element.dataset.preload;
            
            if (preloadData) {
              try {
                const resources = JSON.parse(preloadData) as PreloadResource[];
                this.preloadResources(resources, { priority: 'medium' });
              } catch (error) {
                console.warn('Invalid preload data:', error);
              }
            }
          }
        });
      },
      { rootMargin: `${threshold * 100}%` }
    );

    // Observar elementos con data-preload
    document.querySelectorAll('[data-preload]').forEach(element => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }

  // Limpiar recursos preload
  clearPreloadedResources(): void {
    this.preloadedResources.clear();
    this.preloadQueue = [];
  }

  // Obtener estadísticas
  getStats(): {
    preloadedCount: number;
    queueLength: number;
    isProcessing: boolean;
  } {
    return {
      preloadedCount: this.preloadedResources.size,
      queueLength: this.preloadQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

// Instancia singleton
export const preloadManager = new PreloadManager();

// =====================================================
// HOOK PARA PRELOADING EN REACT (MOVED TO .tsx FILE)
// =====================================================
// Los hooks y componentes de React se han movido al archivo .tsx correspondiente

// =====================================================
// UTILIDADES DE PRELOADING
// =====================================================

// Preload de rutas basado en navegación
export const preloadRouteOnHover = (element: HTMLElement, route: string) => {
  preloadManager.preloadOnHover(element, [{
    href: route,
    as: 'document',
    importance: 'high'
  }]);
};

// Preload de imágenes basado en hover
export const preloadImageOnHover = (element: HTMLElement, imageUrl: string) => {
  preloadManager.preloadOnHover(element, [{
    href: imageUrl,
    as: 'image',
    importance: 'medium'
  }]);
};

// Preload de componentes basado en hover
export const preloadComponentOnHover = (element: HTMLElement, componentPath: string) => {
  preloadManager.preloadOnHover(element, [{
    href: componentPath,
    as: 'script',
    importance: 'medium'
  }]);
};
