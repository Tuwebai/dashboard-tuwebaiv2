// Configuración de producción para variables de entorno
// Este archivo se usa cuando las variables de entorno no están configuradas

export const productionConfig = {
  // Configuración de Supabase para producción - LEE DESDE VARIABLES DE ENTORNO
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  },
  
  // Configuración de la aplicación
  app: {
    name: 'Dashboard TuWebAI',
    version: '1.0.0',
    environment: 'production'
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

// Función para obtener configuración de producción
export const getProductionConfig = () => {
  // Validar que las variables de entorno estén configuradas
  if (!productionConfig.supabase.url || !productionConfig.supabase.anonKey) {
    throw new Error('❌ Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas');
  }
  
  return productionConfig;
};

// Función para verificar si estamos en desarrollo
export const isDevelopment = () => {
  return import.meta.env.DEV || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('localhost');
};

export default productionConfig;
