import React from 'react';
import { cn } from '@/lib/utils';

// =====================================================
// SISTEMA DE A/B TESTING PARA PERFORMANCE
// =====================================================

interface ABTestConfig {
  name: string;
  variants: {
    [key: string]: {
      weight: number;
      config: any;
    };
  };
  metrics: string[];
  duration: number; // días
  isActive: boolean;
}

interface ABTestResult {
  testName: string;
  variant: string;
  metrics: {
    [metric: string]: {
      value: number;
      timestamp: number;
    };
  };
  userId: string;
  sessionId: string;
}

interface PerformanceVariant {
  name: string;
  description: string;
  optimizations: {
    bundleSize?: number;
    imageOptimization?: boolean;
    lazyLoading?: boolean;
    codeSplitting?: boolean;
    caching?: boolean;
    compression?: boolean;
  };
}

class ABTestingManager {
  private tests: Map<string, ABTestConfig> = new Map();
  private results: ABTestResult[] = [];
  private currentTests: Map<string, string> = new Map(); // userId -> variant
  private userId: string;
  private sessionId: string;

  constructor() {
    this.userId = this.getOrCreateUserId();
    this.sessionId = this.getOrCreateSessionId();
    this.initializeTests();
    this.loadExistingTests();
  }

  // =====================================================
  // INICIALIZACIÓN
  // =====================================================

  private initializeTests(): void {
    // Test de optimización de bundle
    this.addTest({
      name: 'bundle_optimization',
      variants: {
        control: {
          weight: 0.5,
          config: {
            bundleSize: 2500, // KB
            imageOptimization: false,
            lazyLoading: false,
            codeSplitting: false,
            caching: false,
            compression: false
          }
        },
        optimized: {
          weight: 0.5,
          config: {
            bundleSize: 1200, // KB
            imageOptimization: true,
            lazyLoading: true,
            codeSplitting: true,
            caching: true,
            compression: true
          }
        }
      },
      metrics: ['FCP', 'LCP', 'CLS', 'FID', 'TTFB'],
      duration: 30,
      isActive: true
    });

    // Test de optimización de imágenes
    this.addTest({
      name: 'image_optimization',
      variants: {
        control: {
          weight: 0.5,
          config: {
            webpSupport: false,
            lazyLoading: false,
            responsiveImages: false,
            imageCompression: false
          }
        },
        optimized: {
          weight: 0.5,
          config: {
            webpSupport: true,
            lazyLoading: true,
            responsiveImages: true,
            imageCompression: true
          }
        }
      },
      metrics: ['LCP', 'CLS'],
      duration: 14,
      isActive: true
    });

    // Test de code splitting
    this.addTest({
      name: 'code_splitting',
      variants: {
        control: {
          weight: 0.5,
          config: {
            chunkSize: 1000, // KB
            preloading: false,
            lazyLoading: false,
            treeShaking: false
          }
        },
        optimized: {
          weight: 0.5,
          config: {
            chunkSize: 200, // KB
            preloading: true,
            lazyLoading: true,
            treeShaking: true
          }
        }
      },
      metrics: ['FCP', 'FID', 'TTFB'],
      duration: 21,
      isActive: true
    });
  }

  private loadExistingTests(): void {
    try {
      const savedTests = localStorage.getItem('ab_tests');
      if (savedTests) {
        const tests = JSON.parse(savedTests);
        tests.forEach((test: ABTestConfig) => {
          this.tests.set(test.name, test);
        });
      }
    } catch (error) {
      console.warn('Failed to load existing A/B tests:', error);
    }
  }

  // =====================================================
  // GESTIÓN DE TESTS
  // =====================================================

  addTest(test: ABTestConfig): void {
    this.tests.set(test.name, test);
    this.saveTests();
  }

  removeTest(testName: string): void {
    this.tests.delete(testName);
    this.saveTests();
  }

  private saveTests(): void {
    try {
      const tests = Array.from(this.tests.values());
      localStorage.setItem('ab_tests', JSON.stringify(tests));
    } catch (error) {
      console.warn('Failed to save A/B tests:', error);
    }
  }

  // =====================================================
  // ASIGNACIÓN DE VARIANTES
  // =====================================================

  getVariant(testName: string): string {
    const test = this.tests.get(testName);
    if (!test || !test.isActive) {
      return 'control';
    }

    // Verificar si ya tiene una variante asignada
    const existingVariant = this.currentTests.get(testName);
    if (existingVariant) {
      return existingVariant;
    }

    // Asignar nueva variante basada en el peso
    const variant = this.assignVariant(test);
    this.currentTests.set(testName, variant);
    this.saveCurrentTests();

    return variant;
  }

  private assignVariant(test: ABTestConfig): string {
    const random = Math.random();
    let cumulativeWeight = 0;

    for (const [variantName, variant] of Object.entries(test.variants)) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        return variantName;
      }
    }

    return 'control'; // Fallback
  }

  private saveCurrentTests(): void {
    try {
      const tests = Object.fromEntries(this.currentTests);
      localStorage.setItem('ab_current_tests', JSON.stringify(tests));
    } catch (error) {
      console.warn('Failed to save current A/B tests:', error);
    }
  }

  // =====================================================
  // APLICACIÓN DE VARIANTES
  // =====================================================

  applyVariant(testName: string, variant: string): void {
    const test = this.tests.get(testName);
    if (!test) return;

    const variantConfig = test.variants[variant];
    if (!variantConfig) return;

    switch (testName) {
      case 'bundle_optimization':
        this.applyBundleOptimization(variantConfig.config);
        break;
      case 'image_optimization':
        this.applyImageOptimization(variantConfig.config);
        break;
      case 'code_splitting':
        this.applyCodeSplitting(variantConfig.config);
        break;
    }
  }

  private applyBundleOptimization(config: any): void {
    // Aplicar optimizaciones de bundle
    if (config.imageOptimization) {
      this.enableImageOptimization();
    }
    if (config.lazyLoading) {
      this.enableLazyLoading();
    }
    if (config.codeSplitting) {
      this.enableCodeSplitting();
    }
    if (config.caching) {
      this.enableCaching();
    }
    if (config.compression) {
      this.enableCompression();
    }
  }

  private applyImageOptimization(config: any): void {
    // Aplicar optimizaciones de imagen
    if (config.webpSupport) {
      this.enableWebPSupport();
    }
    if (config.lazyLoading) {
      this.enableImageLazyLoading();
    }
    if (config.responsiveImages) {
      this.enableResponsiveImages();
    }
    if (config.imageCompression) {
      this.enableImageCompression();
    }
  }

  private applyCodeSplitting(config: any): void {
    // Aplicar optimizaciones de code splitting
    if (config.preloading) {
      this.enablePreloading();
    }
    if (config.lazyLoading) {
      this.enableComponentLazyLoading();
    }
    if (config.treeShaking) {
      this.enableTreeShaking();
    }
  }

  // =====================================================
  // IMPLEMENTACIONES DE OPTIMIZACIONES
  // =====================================================

  private enableImageOptimization(): void {
    // Implementar optimización de imágenes
    console.log('Enabling image optimization');
  }

  private enableLazyLoading(): void {
    // Implementar lazy loading
    console.log('Enabling lazy loading');
  }

  private enableCodeSplitting(): void {
    // Implementar code splitting
    console.log('Enabling code splitting');
  }

  private enableCaching(): void {
    // Implementar caching
    console.log('Enabling caching');
  }

  private enableCompression(): void {
    // Implementar compresión
    console.log('Enabling compression');
  }

  private enableWebPSupport(): void {
    // Implementar soporte WebP
    console.log('Enabling WebP support');
  }

  private enableImageLazyLoading(): void {
    // Implementar lazy loading de imágenes
    console.log('Enabling image lazy loading');
  }

  private enableResponsiveImages(): void {
    // Implementar imágenes responsivas
    console.log('Enabling responsive images');
  }

  private enableImageCompression(): void {
    // Implementar compresión de imágenes
    console.log('Enabling image compression');
  }

  private enablePreloading(): void {
    // Implementar preloading
    console.log('Enabling preloading');
  }

  private enableComponentLazyLoading(): void {
    // Implementar lazy loading de componentes
    console.log('Enabling component lazy loading');
  }

  private enableTreeShaking(): void {
    // Implementar tree shaking
    console.log('Enabling tree shaking');
  }

  // =====================================================
  // RECOLECCIÓN DE MÉTRICAS
  // =====================================================

  recordMetric(testName: string, metric: string, value: number): void {
    const variant = this.getVariant(testName);
    
    const result: ABTestResult = {
      testName,
      variant,
      metrics: {
        [metric]: {
          value,
          timestamp: Date.now()
        }
      },
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.results.push(result);
    this.saveResults();
  }

  private saveResults(): void {
    try {
      localStorage.setItem('ab_test_results', JSON.stringify(this.results));
    } catch (error) {
      console.warn('Failed to save A/B test results:', error);
    }
  }

  // =====================================================
  // ANÁLISIS DE RESULTADOS
  // =====================================================

  getTestResults(testName: string): {
    [variant: string]: {
      [metric: string]: {
        average: number;
        count: number;
        values: number[];
      };
    };
  } {
    const testResults = this.results.filter(result => result.testName === testName);
    const variantResults: any = {};

    testResults.forEach(result => {
      if (!variantResults[result.variant]) {
        variantResults[result.variant] = {};
      }

      Object.entries(result.metrics).forEach(([metric, data]) => {
        if (!variantResults[result.variant][metric]) {
          variantResults[result.variant][metric] = {
            values: [],
            count: 0,
            average: 0
          };
        }

        variantResults[result.variant][metric].values.push(data.value);
        variantResults[result.variant][metric].count++;
      });
    });

    // Calcular promedios
    Object.keys(variantResults).forEach(variant => {
      Object.keys(variantResults[variant]).forEach(metric => {
        const values = variantResults[variant][metric].values;
        variantResults[variant][metric].average = values.reduce((sum, val) => sum + val, 0) / values.length;
      });
    });

    return variantResults;
  }

  getTestWinner(testName: string): {
    winner: string;
    confidence: number;
    improvement: number;
  } | null {
    const results = this.getTestResults(testName);
    const variants = Object.keys(results);
    
    if (variants.length < 2) return null;

    const control = results['control'];
    const test = results[variants.find(v => v !== 'control') || variants[0]];

    if (!control || !test) return null;

    // Calcular mejora promedio
    let totalImprovement = 0;
    let metricCount = 0;

    Object.keys(control).forEach(metric => {
      if (test[metric]) {
        const improvement = ((control[metric].average - test[metric].average) / control[metric].average) * 100;
        totalImprovement += improvement;
        metricCount++;
      }
    });

    const averageImprovement = totalImprovement / metricCount;
    const confidence = this.calculateConfidence(control, test);

    return {
      winner: averageImprovement > 0 ? 'test' : 'control',
      confidence,
      improvement: Math.abs(averageImprovement)
    };
  }

  private calculateConfidence(control: any, test: any): number {
    // Cálculo simplificado de confianza estadística
    // En un entorno real, usarías tests estadísticos como t-test
    const controlValues = Object.values(control).flatMap((metric: any) => metric.values);
    const testValues = Object.values(test).flatMap((metric: any) => metric.values);

    if (controlValues.length < 30 || testValues.length < 30) {
      return 0.5; // Baja confianza con pocas muestras
    }

    // Cálculo simplificado basado en la diferencia de medias
    const controlMean = controlValues.reduce((sum, val) => sum + val, 0) / controlValues.length;
    const testMean = testValues.reduce((sum, val) => sum + val, 0) / testValues.length;
    const difference = Math.abs(testMean - controlMean);
    const maxValue = Math.max(...controlValues, ...testValues);

    return Math.min(0.95, difference / maxValue);
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('ab_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('ab_user_id', userId);
    }
    return userId;
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('ab_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem('ab_session_id', sessionId);
    }
    return sessionId;
  }

  // =====================================================
  // API PÚBLICA
  // =====================================================

  getActiveTests(): ABTestConfig[] {
    return Array.from(this.tests.values()).filter(test => test.isActive);
  }

  getCurrentVariant(testName: string): string {
    return this.getVariant(testName);
  }

  isInTest(testName: string): boolean {
    const test = this.tests.get(testName);
    return test ? test.isActive : false;
  }

  getTestConfig(testName: string): ABTestConfig | undefined {
    return this.tests.get(testName);
  }

  getAllResults(): ABTestResult[] {
    return [...this.results];
  }

  clearResults(): void {
    this.results = [];
    localStorage.removeItem('ab_test_results');
  }

  exportResults(): string {
    return JSON.stringify({
      tests: Array.from(this.tests.values()),
      results: this.results,
      currentTests: Object.fromEntries(this.currentTests),
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

// Instancia singleton
export const abTestingManager = new ABTestingManager();

// =====================================================
// HOOK PARA REACT
// =====================================================

export const useABTesting = () => {
  const [activeTests, setActiveTests] = React.useState(abTestingManager.getActiveTests());
  const [currentVariants, setCurrentVariants] = React.useState<{[key: string]: string}>({});

  React.useEffect(() => {
    // Obtener variantes actuales para todos los tests activos
    const variants: {[key: string]: string} = {};
    activeTests.forEach(test => {
      variants[test.name] = abTestingManager.getCurrentVariant(test.name);
    });
    setCurrentVariants(variants);

    // Aplicar variantes
    Object.entries(variants).forEach(([testName, variant]) => {
      abTestingManager.applyVariant(testName, variant);
    });
  }, [activeTests]);

  const recordMetric = React.useCallback((testName: string, metric: string, value: number) => {
    abTestingManager.recordMetric(testName, metric, value);
  }, []);

  const getTestResults = React.useCallback((testName: string) => {
    return abTestingManager.getTestResults(testName);
  }, []);

  const getTestWinner = React.useCallback((testName: string) => {
    return abTestingManager.getTestWinner(testName);
  }, []);

  const isInTest = React.useCallback((testName: string) => {
    return abTestingManager.isInTest(testName);
  }, []);

  const getCurrentVariant = React.useCallback((testName: string) => {
    return abTestingManager.getCurrentVariant(testName);
  }, []);

  return {
    activeTests,
    currentVariants,
    recordMetric,
    getTestResults,
    getTestWinner,
    isInTest,
    getCurrentVariant
  };
};

// =====================================================
// COMPONENTE DE DASHBOARD DE A/B TESTING
// =====================================================

interface ABTestingDashboardProps {
  className?: string;
}

export function ABTestingDashboard({ className }: ABTestingDashboardProps) {
  const { activeTests, currentVariants, getTestResults, getTestWinner } = useABTesting();
  const [selectedTest, setSelectedTest] = React.useState<string>('');

  const handleTestSelect = (testName: string) => {
    setSelectedTest(testName);
  };

  const formatValue = (value: number, metric: string) => {
    if (metric === 'CLS') {
      return value.toFixed(3);
    }
    return `${value.toFixed(0)}ms`;
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">A/B Testing Dashboard</h3>

      <div className="space-y-6">
        {/* Lista de tests activos */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Tests Activos</h4>
          <div className="space-y-2">
            {activeTests.map(test => (
              <div
                key={test.name}
                className={cn(
                  'p-3 border rounded-md cursor-pointer transition-colors',
                  selectedTest === test.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => handleTestSelect(test.name)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{test.name}</div>
                    <div className="text-sm text-gray-500">
                      Variante: {currentVariants[test.name] || 'control'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {test.duration} días
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resultados del test seleccionado */}
        {selectedTest && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Resultados</h4>
            <div className="bg-gray-50 rounded-md p-4">
              {(() => {
                const results = getTestResults(selectedTest);
                const winner = getTestWinner(selectedTest);
                
                return (
                  <div className="space-y-4">
                    {Object.entries(results).map(([variant, metrics]) => (
                      <div key={variant} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="font-medium text-gray-900 mb-2">
                          Variante: {variant}
                          {winner && winner.winner === variant && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Ganadora
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(metrics).map(([metric, data]) => (
                            <div key={metric} className="text-center">
                              <div className="text-lg font-bold text-gray-900">
                                {formatValue(data.average, metric)}
                              </div>
                              <div className="text-sm text-gray-500">{metric}</div>
                              <div className="text-xs text-gray-400">
                                {data.count} muestras
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {winner && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="text-sm text-blue-800">
                          <strong>Confianza:</strong> {(winner.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-blue-800">
                          <strong>Mejora:</strong> {winner.improvement.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
