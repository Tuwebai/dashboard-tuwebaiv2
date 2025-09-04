// =====================================================
// OPTIMIZADOR DE CORE WEB VITALS
// =====================================================

interface WebVitalsConfig {
  targetFCP: number; // First Contentful Paint (ms)
  targetLCP: number; // Largest Contentful Paint (ms)
  targetCLS: number; // Cumulative Layout Shift
  targetFID: number; // First Input Delay (ms)
  targetTTFB: number; // Time to First Byte (ms)
}

interface OptimizationResult {
  metric: string;
  current: number;
  target: number;
  improvement: number;
  recommendations: string[];
  implemented: boolean;
}

class WebVitalsOptimizer {
  private config: WebVitalsConfig;
  private optimizations: Map<string, OptimizationResult> = new Map();

  constructor(config: Partial<WebVitalsConfig> = {}) {
    this.config = {
      targetFCP: 1800, // 1.8s
      targetLCP: 2500, // 2.5s
      targetCLS: 0.1,  // 0.1
      targetFID: 100,  // 100ms
      targetTTFB: 800, // 800ms
      ...config
    };

    this.init();
  }

  private init(): void {
    // Inicializar optimizaciones
    this.initializeOptimizations();
    
    // Aplicar optimizaciones automáticas
    this.applyAutomaticOptimizations();
    
    // Monitorear métricas en tiempo real
    this.monitorWebVitals();
  }

  // =====================================================
  // INICIALIZACIÓN DE OPTIMIZACIONES
  // =====================================================

  private initializeOptimizations(): void {
    // FCP Optimizations
    this.optimizations.set('FCP', {
      metric: 'FCP',
      current: 0,
      target: this.config.targetFCP,
      improvement: 0,
      recommendations: [
        'Minificar y comprimir CSS crítico',
        'Eliminar CSS no utilizado',
        'Optimizar fuentes web',
        'Preload recursos críticos',
        'Usar Critical CSS inline'
      ],
      implemented: false
    });

    // LCP Optimizations
    this.optimizations.set('LCP', {
      metric: 'LCP',
      current: 0,
      target: this.config.targetLCP,
      improvement: 0,
      recommendations: [
        'Optimizar imágenes con WebP',
        'Implementar lazy loading',
        'Preload imágenes críticas',
        'Usar CDN para assets',
        'Optimizar renderizado del elemento más grande'
      ],
      implemented: false
    });

    // CLS Optimizations
    this.optimizations.set('CLS', {
      metric: 'CLS',
      current: 0,
      target: this.config.targetCLS,
      improvement: 0,
      recommendations: [
        'Definir dimensiones para imágenes',
        'Reservar espacio para anuncios',
        'Evitar insertar contenido dinámico',
        'Usar transform en lugar de cambiar propiedades de layout',
        'Preload fuentes web'
      ],
      implemented: false
    });

    // FID Optimizations
    this.optimizations.set('FID', {
      metric: 'FID',
      current: 0,
      target: this.config.targetFID,
      improvement: 0,
      recommendations: [
        'Dividir JavaScript en chunks más pequeños',
        'Usar Web Workers para tareas pesadas',
        'Optimizar event listeners',
        'Implementar code splitting',
        'Reducir tiempo de ejecución de JavaScript'
      ],
      implemented: false
    });

    // TTFB Optimizations
    this.optimizations.set('TTFB', {
      metric: 'TTFB',
      current: 0,
      target: this.config.targetTTFB,
      improvement: 0,
      recommendations: [
        'Optimizar servidor y base de datos',
        'Usar CDN',
        'Implementar cache en servidor',
        'Optimizar consultas de base de datos',
        'Usar HTTP/2'
      ],
      implemented: false
    });
  }

  // =====================================================
  // OPTIMIZACIONES AUTOMÁTICAS
  // =====================================================

  private applyAutomaticOptimizations(): void {
    // Optimizar FCP
    this.optimizeFCP();
    
    // Optimizar LCP
    this.optimizeLCP();
    
    // Optimizar CLS
    this.optimizeCLS();
    
    // Optimizar FID
    this.optimizeFID();
  }

  private optimizeFCP(): void {
    // Preload fuentes críticas
    this.preloadCriticalFonts();
    
    // Inline CSS crítico
    this.inlineCriticalCSS();
    
    // Optimizar renderizado inicial
    this.optimizeInitialRender();
    
    this.optimizations.get('FCP')!.implemented = true;
  }

  private optimizeLCP(): void {
    // Optimizar imágenes
    this.optimizeImages();
    
    // Preload recursos críticos
    this.preloadCriticalResources();
    
    // Optimizar renderizado del elemento más grande
    this.optimizeLargestElement();
    
    this.optimizations.get('LCP')!.implemented = true;
  }

  private optimizeCLS(): void {
    // Estabilizar layout
    this.stabilizeLayout();
    
    // Optimizar fuentes
    this.optimizeFonts();
    
    // Prevenir layout shifts
    this.preventLayoutShifts();
    
    this.optimizations.get('CLS')!.implemented = true;
  }

  private optimizeFID(): void {
    // Optimizar JavaScript
    this.optimizeJavaScript();
    
    // Implementar code splitting
    this.implementCodeSplitting();
    
    // Optimizar event listeners
    this.optimizeEventListeners();
    
    this.optimizations.get('FID')!.implemented = true;
  }

  // =====================================================
  // IMPLEMENTACIONES ESPECÍFICAS
  // =====================================================

  private preloadCriticalFonts(): void {
    const criticalFonts = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    ];

    criticalFonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = font;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  private inlineCriticalCSS(): void {
    // CSS crítico inline para evitar render-blocking
    const criticalCSS = `
      body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.appendChild(style);
  }

  private optimizeInitialRender(): void {
    // Remover elementos no críticos del renderizado inicial
    const nonCriticalElements = document.querySelectorAll('[data-non-critical]');
    nonCriticalElements.forEach(element => {
      element.style.display = 'none';
    });

    // Mostrar elementos no críticos después de la carga
    window.addEventListener('load', () => {
      nonCriticalElements.forEach(element => {
        element.style.display = '';
      });
    });
  }

  private optimizeImages(): void {
    // Convertir imágenes a WebP
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.src.includes('.webp')) {
        const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        const webpImg = new Image();
        webpImg.onload = () => {
          img.src = webpSrc;
        };
        webpImg.src = webpSrc;
      }
    });

    // Implementar lazy loading
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  private preloadCriticalResources(): void {
    const criticalResources = [
      '/logoweb.jpg',
      '/favicon.ico'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  private optimizeLargestElement(): void {
    // Identificar y optimizar el elemento más grande
    const largestElement = this.findLargestElement();
    if (largestElement) {
      // Preload imagen si es una imagen
      if (largestElement.tagName === 'IMG') {
        const img = largestElement as HTMLImageElement;
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img.src;
        document.head.appendChild(link);
      }
    }
  }

  private findLargestElement(): Element | null {
    const elements = document.querySelectorAll('*');
    let largestElement: Element | null = null;
    let largestArea = 0;

    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area > largestArea) {
        largestArea = area;
        largestElement = element;
      }
    });

    return largestElement;
  }

  private stabilizeLayout(): void {
    // Definir dimensiones para imágenes
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        img.setAttribute('width', rect.width.toString());
        img.setAttribute('height', rect.height.toString());
      }
    });

    // Reservar espacio para elementos dinámicos
    const dynamicElements = document.querySelectorAll('[data-dynamic]');
    dynamicElements.forEach(element => {
      element.style.minHeight = '200px'; // Altura mínima para prevenir CLS
    });
  }

  private optimizeFonts(): void {
    // Preload fuentes web
    const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
    fontLinks.forEach(link => {
      link.setAttribute('rel', 'preload');
      link.setAttribute('as', 'style');
      link.setAttribute('onload', "this.onload=null;this.rel='stylesheet'");
    });

    // Fallback para fuentes
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
        src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      }
    `;
    document.head.appendChild(style);
  }

  private preventLayoutShifts(): void {
    // Usar transform en lugar de cambiar propiedades de layout
    const style = document.createElement('style');
    style.textContent = `
      .no-layout-shift {
        transform: translateZ(0);
        will-change: transform;
      }
    `;
    document.head.appendChild(style);

    // Aplicar clase a elementos que pueden causar layout shifts
    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(element => {
      element.classList.add('no-layout-shift');
    });
  }

  private optimizeJavaScript(): void {
    // Dividir JavaScript en chunks más pequeños
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      if (script.getAttribute('defer') === null && script.getAttribute('async') === null) {
        script.setAttribute('defer', '');
      }
    });
  }

  private implementCodeSplitting(): void {
    // Implementar code splitting dinámico
    const lazyComponents = document.querySelectorAll('[data-lazy-component]');
    lazyComponents.forEach(component => {
      const componentName = component.getAttribute('data-lazy-component');
      if (componentName) {
        // Cargar componente cuando sea visible
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadComponent(componentName);
              observer.unobserve(entry.target);
            }
          });
        });
        observer.observe(component);
      }
    });
  }

  private async loadComponent(componentName: string): Promise<void> {
    try {
      // Simular carga de componente
      const module = await import(`../components/${componentName}`);
      console.log(`Component ${componentName} loaded`);
    } catch (error) {
      console.warn(`Failed to load component ${componentName}:`, error);
    }
  }

  private optimizeEventListeners(): void {
    // Usar event delegation para reducir el número de listeners
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const handler = target.closest('[data-click-handler]');
      if (handler) {
        const handlerName = handler.getAttribute('data-click-handler');
        if (handlerName && (window as any)[handlerName]) {
          (window as any)[handlerName](event);
        }
      }
    });
  }

  // =====================================================
  // MONITOREO DE WEB VITALS
  // =====================================================

  private monitorWebVitals(): void {
    if ('PerformanceObserver' in window) {
      // Monitorear FCP
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.updateMetric('FCP', entry.startTime);
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Monitorear LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.updateMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Monitorear CLS
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.updateMetric('CLS', clsValue);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Monitorear FID
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.updateMetric('FID', entry.processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    }
  }

  private updateMetric(metric: string, value: number): void {
    const optimization = this.optimizations.get(metric);
    if (optimization) {
      optimization.current = value;
      optimization.improvement = ((optimization.target - value) / optimization.target) * 100;
    }
  }

  // =====================================================
  // API PÚBLICA
  // =====================================================

  getOptimizations(): OptimizationResult[] {
    return Array.from(this.optimizations.values());
  }

  getOptimization(metric: string): OptimizationResult | undefined {
    return this.optimizations.get(metric);
  }

  getOverallScore(): number {
    const optimizations = this.getOptimizations();
    const totalImprovement = optimizations.reduce((sum, opt) => sum + opt.improvement, 0);
    return Math.max(0, Math.min(100, totalImprovement / optimizations.length));
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];
    this.optimizations.forEach(optimization => {
      if (optimization.current > optimization.target) {
        recommendations.push(...optimization.recommendations);
      }
    });
    return [...new Set(recommendations)]; // Eliminar duplicados
  }

  applyOptimization(metric: string): boolean {
    const optimization = this.optimizations.get(metric);
    if (optimization && !optimization.implemented) {
      switch (metric) {
        case 'FCP':
          this.optimizeFCP();
          break;
        case 'LCP':
          this.optimizeLCP();
          break;
        case 'CLS':
          this.optimizeCLS();
          break;
        case 'FID':
          this.optimizeFID();
          break;
        default:
          return false;
      }
      return true;
    }
    return false;
  }
}

// Instancia singleton
export const webVitalsOptimizer = new WebVitalsOptimizer();

// =====================================================
// HOOK PARA REACT (MOVED TO .tsx FILE)
// =====================================================
// El hook useWebVitalsOptimizer se ha movido al archivo .tsx correspondiente
