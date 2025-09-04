import React from 'react';
import { cn } from '@/lib/utils';
import { getPerformanceConfig } from '@/config/performance';

// =====================================================
// SISTEMA DE MONITORING DE PERFORMANCE
// =====================================================

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'navigation' | 'paint' | 'layout' | 'resource' | 'custom';
  url?: string;
  userAgent?: string;
  connection?: string;
}

interface PerformanceConfig {
  enableWebVitals: boolean;
  enableResourceTiming: boolean;
  enableNavigationTiming: boolean;
  enableCustomMetrics: boolean;
  sampleRate: number;
  endpoint?: string;
  batchSize: number;
  flushInterval: number;
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  public isEnabled: boolean = true;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    // Usar configuración por defecto del entorno y mergear con configuración personalizada
    const defaultConfig = getPerformanceConfig();
    this.config = {
      ...defaultConfig,
      ...config
    };

    this.init();
  }

  private init(): void {
    if (!this.isEnabled || Math.random() > this.config.sampleRate) {
      return;
    }

    // Inicializar Web Vitals
    if (this.config.enableWebVitals) {
      this.initWebVitals();
    }

    // Inicializar Resource Timing
    if (this.config.enableResourceTiming) {
      this.initResourceTiming();
    }

    // Inicializar Navigation Timing
    if (this.config.enableNavigationTiming) {
      this.initNavigationTiming();
    }

    // Configurar flush automático
    this.startFlushTimer();
  }

  // =====================================================
  // WEB VITALS
  // =====================================================

  private initWebVitals(): void {
    // First Contentful Paint (FCP)
    this.observePaint('first-contentful-paint', 'FCP');

    // Largest Contentful Paint (LCP)
    this.observeLCP();

    // First Input Delay (FID)
    this.observeFID();

    // Cumulative Layout Shift (CLS)
    this.observeCLS();

    // Time to First Byte (TTFB)
    this.observeTTFB();
  }

  private observePaint(name: string, metricName: string): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: metricName,
            value: entry.startTime,
            timestamp: Date.now(),
            type: 'paint'
          });
        }
      });

      try {
        observer.observe({ entryTypes: ['paint'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  private observeLCP(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          timestamp: Date.now(),
          type: 'paint'
        });
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }
    }
  }

  private observeFID(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'FID',
            value: (entry as any).processingStart - entry.startTime,
            timestamp: Date.now(),
            type: 'custom'
          });
        }
      });

      try {
        observer.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }
    }
  }

  private observeCLS(): void {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        this.recordMetric({
          name: 'CLS',
          value: clsValue,
          timestamp: Date.now(),
          type: 'layout'
        });
      });

      try {
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }
    }
  }

  private observeTTFB(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.recordMetric({
          name: 'TTFB',
          value: navigation.responseStart - navigation.requestStart,
          timestamp: Date.now(),
          type: 'navigation'
        });
      }
    }
  }

  // =====================================================
  // RESOURCE TIMING
  // =====================================================

  private initResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Tiempo de carga del recurso
          this.recordMetric({
            name: 'ResourceLoadTime',
            value: resourceEntry.responseEnd - resourceEntry.requestStart,
            timestamp: Date.now(),
            type: 'resource',
            url: resourceEntry.name
          });

          // Tamaño del recurso
          if (resourceEntry.transferSize > 0) {
            this.recordMetric({
              name: 'ResourceSize',
              value: resourceEntry.transferSize,
              timestamp: Date.now(),
              type: 'resource',
              url: resourceEntry.name
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Resource timing observer not supported:', error);
      }
    }
  }

  // =====================================================
  // NAVIGATION TIMING
  // =====================================================

  private initNavigationTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        // Tiempo total de carga
        this.recordMetric({
          name: 'PageLoadTime',
          value: navigation.loadEventEnd - navigation.fetchStart,
          timestamp: Date.now(),
          type: 'navigation'
        });

        // Tiempo de DOM Content Loaded
        this.recordMetric({
          name: 'DOMContentLoaded',
          value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          timestamp: Date.now(),
          type: 'navigation'
        });

        // Tiempo de DNS lookup
        this.recordMetric({
          name: 'DNSTime',
          value: navigation.domainLookupEnd - navigation.domainLookupStart,
          timestamp: Date.now(),
          type: 'navigation'
        });

        // Tiempo de conexión TCP
        this.recordMetric({
          name: 'TCPTime',
          value: navigation.connectEnd - navigation.connectStart,
          timestamp: Date.now(),
          type: 'navigation'
        });
      }
    }
  }

  // =====================================================
  // MÉTRICAS PERSONALIZADAS
  // =====================================================

  recordCustomMetric(name: string, value: number, type: 'custom' = 'custom'): void {
    if (!this.isEnabled) return;

    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      type
    });
  }

  recordUserInteraction(action: string, duration: number): void {
    this.recordCustomMetric(`UserInteraction_${action}`, duration);
  }

  recordComponentRender(componentName: string, renderTime: number): void {
    this.recordCustomMetric(`ComponentRender_${componentName}`, renderTime);
  }

  recordAPICall(endpoint: string, duration: number, status: number): void {
    this.recordCustomMetric(`APICall_${endpoint}`, duration);
    this.recordCustomMetric(`APICall_${endpoint}_Status`, status);
  }

  recordError(error: Error, context?: string): void {
    this.recordCustomMetric('Error', 1);
    this.recordCustomMetric(`Error_${context || 'Unknown'}`, 1);
  }

  // =====================================================
  // GESTIÓN DE MÉTRICAS
  // =====================================================

  private recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    // Agregar información adicional
    metric.url = window.location.href;
    metric.userAgent = navigator.userAgent;
    metric.connection = (navigator as any).connection?.effectiveType || 'unknown';

    this.metrics.push(metric);

    // Flush si alcanzamos el batch size
    if (this.metrics.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.metrics.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    // Si no hay endpoint configurado, no hacer nada
    if (!this.config.endpoint) {
      return;
    }

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: metricsToSend,
          timestamp: Date.now(),
          sessionId: this.getSessionId()
        })
      });
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
      // Re-agregar métricas si falla el envío
      this.metrics.unshift(...metricsToSend);
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('performance_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('performance_session_id', sessionId);
    }
    return sessionId;
  }

  // =====================================================
  // API PÚBLICA
  // =====================================================

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  setEndpoint(endpoint: string | undefined): void {
    this.config.endpoint = endpoint;
  }

  getEndpoint(): string | undefined {
    return this.config.endpoint;
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  async forceFlush(): Promise<void> {
    await this.flush();
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }

  // =====================================================
  // ANÁLISIS DE PERFORMANCE
  // =====================================================

  getPerformanceScore(): {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let score = 100;

    // Analizar métricas críticas
    const fcp = this.metrics.find(m => m.name === 'FCP')?.value || 0;
    const lcp = this.metrics.find(m => m.name === 'LCP')?.value || 0;
    const cls = this.metrics.find(m => m.name === 'CLS')?.value || 0;
    const fid = this.metrics.find(m => m.name === 'FID')?.value || 0;

    // FCP scoring
    if (fcp > 3000) {
      score -= 20;
      recommendations.push('First Contentful Paint es muy lento (>3s). Optimiza la carga inicial.');
    } else if (fcp > 1800) {
      score -= 10;
      recommendations.push('First Contentful Paint es lento (>1.8s). Considera optimizaciones.');
    }

    // LCP scoring
    if (lcp > 4000) {
      score -= 25;
      recommendations.push('Largest Contentful Paint es muy lento (>4s). Optimiza imágenes y recursos críticos.');
    } else if (lcp > 2500) {
      score -= 15;
      recommendations.push('Largest Contentful Paint es lento (>2.5s). Optimiza el contenido más grande.');
    }

    // CLS scoring
    if (cls > 0.25) {
      score -= 20;
      recommendations.push('Cumulative Layout Shift es alto (>0.25). Estabiliza el layout.');
    } else if (cls > 0.1) {
      score -= 10;
      recommendations.push('Cumulative Layout Shift es moderado (>0.1). Mejora la estabilidad del layout.');
    }

    // FID scoring
    if (fid > 300) {
      score -= 15;
      recommendations.push('First Input Delay es alto (>300ms). Optimiza JavaScript.');
    } else if (fid > 100) {
      score -= 5;
      recommendations.push('First Input Delay es moderado (>100ms). Considera optimizaciones de JS.');
    }

    // Determinar grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return { score, grade, recommendations };
  }
}

// Instancia singleton
export const performanceMonitor = new PerformanceMonitor();

// Exponer en window para acceso global
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
}

// =====================================================
// HOOK PARA REACT
// =====================================================

export const usePerformanceMonitor = () => {
  const [isEnabled, setIsEnabled] = React.useState(performanceMonitor.isEnabled);
  const [metrics, setMetrics] = React.useState(performanceMonitor.getMetrics());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const recordCustomMetric = React.useCallback((name: string, value: number) => {
    performanceMonitor.recordCustomMetric(name, value);
  }, []);

  const recordUserInteraction = React.useCallback((action: string, duration: number) => {
    performanceMonitor.recordUserInteraction(action, duration);
  }, []);

  const recordComponentRender = React.useCallback((componentName: string, renderTime: number) => {
    performanceMonitor.recordComponentRender(componentName, renderTime);
  }, []);

  const recordAPICall = React.useCallback((endpoint: string, duration: number, status: number) => {
    performanceMonitor.recordAPICall(endpoint, duration, status);
  }, []);

  const recordError = React.useCallback((error: Error, context?: string) => {
    performanceMonitor.recordError(error, context);
  }, []);

  const getPerformanceScore = React.useCallback(() => {
    return performanceMonitor.getPerformanceScore();
  }, []);

  const enable = React.useCallback(() => {
    performanceMonitor.enable();
    setIsEnabled(true);
  }, []);

  const disable = React.useCallback(() => {
    performanceMonitor.disable();
    setIsEnabled(false);
  }, []);

  const clearMetrics = React.useCallback(() => {
    performanceMonitor.clearMetrics();
    setMetrics([]);
  }, []);

  const forceFlush = React.useCallback(async () => {
    await performanceMonitor.forceFlush();
  }, []);

  const setEndpoint = React.useCallback((endpoint: string | undefined) => {
    performanceMonitor.setEndpoint(endpoint);
  }, []);

  const getEndpoint = React.useCallback(() => {
    return performanceMonitor.getEndpoint();
  }, []);

  return {
    isEnabled,
    metrics,
    recordCustomMetric,
    recordUserInteraction,
    recordComponentRender,
    recordAPICall,
    recordError,
    getPerformanceScore,
    enable,
    disable,
    clearMetrics,
    forceFlush,
    setEndpoint,
    getEndpoint
  };
};

// =====================================================
// COMPONENTE DE DASHBOARD DE PERFORMANCE
// =====================================================

interface PerformanceDashboardProps {
  className?: string;
}

export function PerformanceDashboard({ className }: PerformanceDashboardProps) {
  const { metrics, getPerformanceScore, clearMetrics, forceFlush, setEndpoint, getEndpoint } = usePerformanceMonitor();
  const [score, setScore] = React.useState<ReturnType<typeof getPerformanceScore> | null>(null);
  const [endpoint, setEndpointState] = React.useState<string | undefined>(getEndpoint());

  React.useEffect(() => {
    setScore(getPerformanceScore());
  }, [metrics, getPerformanceScore]);

  const getScoreColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatValue = (value: number, unit: string = 'ms') => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}s`;
    }
    return `${value.toFixed(0)}${unit}`;
  };

  const handleEndpointChange = (newEndpoint: string) => {
    setEndpoint(newEndpoint || undefined);
    setEndpointState(newEndpoint || undefined);
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Performance Monitor</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={clearMetrics}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            Limpiar
          </button>
          <button
            onClick={forceFlush}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
          >
            Enviar
          </button>
        </div>
      </div>

      {/* Configuración del endpoint */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Configuración del Endpoint</h4>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={endpoint || ''}
            onChange={(e) => handleEndpointChange(e.target.value)}
            placeholder="URL del endpoint (opcional)"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleEndpointChange('')}
            className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
          >
            Deshabilitar
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {endpoint ? `Enviando métricas a: ${endpoint}` : 'Métricas solo en consola (desarrollo)'}
        </p>
      </div>

      {score && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-3xl font-bold">
              <span className={getScoreColor(score.grade)}>{score.score}</span>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">Puntuación: {score.grade}</div>
              <div className="text-sm text-gray-500">{metrics.length} métricas registradas</div>
            </div>
          </div>

          {score.recommendations.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Recomendaciones:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {score.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['FCP', 'LCP', 'CLS', 'FID'].map(metricName => {
          const metric = metrics.find(m => m.name === metricName);
          const value = metric?.value || 0;
          
          return (
            <div key={metricName} className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatValue(value, metricName === 'CLS' ? '' : 'ms')}
              </div>
              <div className="text-sm text-gray-500">{metricName}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
