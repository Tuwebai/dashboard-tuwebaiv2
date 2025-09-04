// Configuración de producción para variables de entorno
// Este archivo se usa cuando las variables de entorno no están configuradas

export const productionConfig = {
  // Configuración de Supabase para producción
  supabase: {
    url: 'https://xebnhwjzchrsbhzbtlsg.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlYm5od2p6Y2hyc2JoemJ0bHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4MDAsImV4cCI6MjA1MDU1MDgwMH0.placeholder_key'
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
