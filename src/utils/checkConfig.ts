// Utilidad para verificar la configuración de Websy AI

export interface ConfigCheck {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export const checkWebsyAIConfig = (): ConfigCheck => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Verificar API key de Gemini
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.REACT_APP_GEMINI_API_KEY;
  if (!geminiApiKey) {
    errors.push('VITE_GEMINI_API_KEY o REACT_APP_GEMINI_API_KEY no está configurada');
  } else if (geminiApiKey.length < 20) {
    errors.push('API key de Gemini parece inválida (muy corta)');
  } else if (!geminiApiKey.startsWith('AIza')) {
    warnings.push('API key de Gemini no tiene el formato esperado de Google AI');
  }

  // Verificar variables de Supabase
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL no está configurada');
  } else if (!supabaseUrl.includes('supabase.co')) {
    warnings.push('VITE_SUPABASE_URL no parece ser una URL válida de Supabase');
  }

  if (!supabaseKey) {
    errors.push('VITE_SUPABASE_ANON_KEY no está configurada');
  } else if (supabaseKey.length < 50) {
    warnings.push('VITE_SUPABASE_ANON_KEY parece inválida (muy corta)');
  }

  // Recomendaciones
  if (errors.length === 0) {
    recommendations.push('Configuración básica completa');
    recommendations.push('Ejecuta el script SQL/create_websy_ai_tables.sql en Supabase');
    recommendations.push('Prueba enviar un mensaje a Websy AI');
  } else {
    recommendations.push('Corrige los errores antes de usar Websy AI');
    recommendations.push('Verifica el archivo .env.local');
    recommendations.push('Reinicia el servidor de desarrollo después de cambiar variables de entorno');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
};

export const logConfigStatus = () => {
  const config = checkWebsyAIConfig();
  
  console.log('🔧 Estado de configuración de Websy AI:');
  console.log('=====================================');
  
  if (config.isValid) {
    console.log('✅ Configuración válida');
  } else {
    console.log('❌ Configuración inválida');
  }
  
  if (config.errors.length > 0) {
    console.log('\n🚨 Errores:');
    config.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (config.warnings.length > 0) {
    console.log('\n⚠️ Advertencias:');
    config.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  if (config.recommendations.length > 0) {
    console.log('\n💡 Recomendaciones:');
    config.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
  
  console.log('=====================================');
  
  return config;
};
