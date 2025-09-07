// Configuración de entorno para la aplicación TuWebAI Dashboard

// Detectar el entorno actual
const isDevelopment = import.meta.env.DEV || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('localhost');

const isProduction = import.meta.env.PROD;

export const config = {
  // Detectar el entorno actual
  isDevelopment,
  isProduction,
  
  // Obtener la URL base según el entorno
  getBaseUrl: () => {
    if (isDevelopment) {
      return window.location.origin;
    }
    return import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  },
  
  // URLs de redirección
  getAuthRedirectUrl: () => `${config.getBaseUrl()}/auth/callback`,
  getResetPasswordUrl: () => `${config.getBaseUrl()}/auth/reset-password`,
  
  // Configuración de Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },

  // Configuración de Gemini AI Multi-API
  gemini: {
    apiKeys: [
      import.meta.env.VITE_GEMINI_API_KEY_1,
      import.meta.env.VITE_GEMINI_API_KEY_2,
      import.meta.env.VITE_GEMINI_API_KEY_3,
      import.meta.env.VITE_GEMINI_API_KEY_4,
      import.meta.env.VITE_GEMINI_API_KEY_5,
    ].filter(Boolean), // Filtrar keys vacías
    legacyKey: import.meta.env.REACT_APP_GEMINI_API_KEY,
    resetIntervalHours: 24,
    enableLogging: import.meta.env.VITE_DEBUG_MODE === 'true' || isDevelopment
  },
  
  // Configuración de la aplicación
  app: {
    name: 'Dashboard TuWebAI',
    version: '1.0.0',
    environment: isDevelopment ? 'development' : 'production',
    baseUrl: import.meta.env.BASE_URL || '/'
  },

  // Configuración de features
  features: {
    realTimeCollaboration: true,
    advancedAnalytics: true,
    automationSystem: true,
    fileManagement: true,
    codeEditor: true,
    notifications: true
  },

  // Configuración de límites
  limits: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxProjectsPerUser: 100,
    maxCollaboratorsPerProject: 20,
    maxFileUploadsPerDay: 100
  }
};

// Validar configuración crítica
if (!config.supabase.url || !config.supabase.anonKey) {
  if (isDevelopment) {
    console.warn('⚠️ Variables de entorno de Supabase no configuradas');
  } else {
    throw new Error('❌ Variables de entorno de Supabase requeridas en producción');
  }
}

export default config;
