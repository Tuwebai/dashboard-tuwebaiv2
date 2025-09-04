// =====================================================
// CONFIGURACIÓN DE PERFORMANCE MONITOR
// =====================================================

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

// Configuración por defecto
const defaultConfig: PerformanceConfig = {
  enableWebVitals: true,
  enableResourceTiming: true,
  enableNavigationTiming: true,
  enableCustomMetrics: true,
  sampleRate: 1.0,
  endpoint: undefined, // Deshabilitado por defecto
  batchSize: 10,
  flushInterval: 30000, // 30 segundos
};

// Configuración para desarrollo
const developmentConfig: Partial<PerformanceConfig> = {
  sampleRate: 1.0, // 100% de muestreo en desarrollo
  endpoint: undefined, // No enviar a servidor en desarrollo
};

// Configuración para producción
const productionConfig: Partial<PerformanceConfig> = {
  sampleRate: 0.1, // 10% de muestreo en producción
  endpoint: '/api/performance', // Endpoint de producción
  batchSize: 20,
  flushInterval: 60000, // 1 minuto
};

// Configuración para testing
const testingConfig: Partial<PerformanceConfig> = {
  sampleRate: 0.0, // No muestrear en testing
  endpoint: undefined,
  enableWebVitals: false,
  enableResourceTiming: false,
  enableNavigationTiming: false,
  enableCustomMetrics: false,
};

// Función para obtener la configuración según el entorno
export const getPerformanceConfig = (): PerformanceConfig => {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'development':
      return { ...defaultConfig, ...developmentConfig };
    case 'production':
      return { ...defaultConfig, ...productionConfig };
    case 'test':
      return { ...defaultConfig, ...testingConfig };
    default:
      return defaultConfig;
  }
};

// Función para configurar el endpoint dinámicamente
export const setPerformanceEndpoint = (endpoint: string | undefined) => {
  // Esta función se puede usar para configurar el endpoint en tiempo de ejecución
  if (typeof window !== 'undefined') {
    const performanceMonitor = (window as any).performanceMonitor;
    if (performanceMonitor && performanceMonitor.setEndpoint) {
      performanceMonitor.setEndpoint(endpoint);
    }
  }
};

// Función para obtener el endpoint actual
export const getPerformanceEndpoint = (): string | undefined => {
  if (typeof window !== 'undefined') {
    const performanceMonitor = (window as any).performanceMonitor;
    if (performanceMonitor && performanceMonitor.getEndpoint) {
      return performanceMonitor.getEndpoint();
    }
  }
  return undefined;
};

// Configuraciones predefinidas para diferentes servicios
export const performanceEndpoints = {
  // Ejemplos de endpoints para diferentes servicios
  local: 'http://localhost:3000/api/performance',
  staging: 'https://staging-api.tuwebai.com/api/performance',
  production: 'https://api.tuwebai.com/api/performance',
  analytics: 'https://analytics.tuwebai.com/api/performance',
  monitoring: 'https://monitoring.tuwebai.com/api/performance',
};

// Función para configurar el endpoint basado en el entorno
export const configurePerformanceEndpoint = () => {
  const env = process.env.NODE_ENV;
  const baseUrl = process.env.REACT_APP_API_URL || process.env.VITE_API_URL;
  
  if (baseUrl) {
    setPerformanceEndpoint(`${baseUrl}/api/performance`);
  } else {
    // Usar configuración por defecto según el entorno
    const config = getPerformanceConfig();
    setPerformanceEndpoint(config.endpoint);
  }
};

export default getPerformanceConfig;
