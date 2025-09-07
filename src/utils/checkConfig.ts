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

  // Verificar API keys de Gemini (Sistema Multi-API)
  const geminiApiKeys = [];
  for (let i = 1; i <= 5; i++) {
    const key = import.meta.env[`VITE_GEMINI_API_KEY_${i}`] || import.meta.env[`REACT_APP_GEMINI_API_KEY_${i}`];
    if (key && key.trim()) {
      geminiApiKeys.push(key.trim());
    }
  }
  
  const legacyKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.REACT_APP_GEMINI_API_KEY;
  
  if (geminiApiKeys.length === 0 && !legacyKey) {
    errors.push('No se encontraron API keys de Gemini configuradas. Configura al menos VITE_GEMINI_API_KEY_1 o REACT_APP_GEMINI_API_KEY');
  } else if (geminiApiKeys.length === 0 && legacyKey) {
    warnings.push('Solo se encontró API key legacy. Se recomienda configurar múltiples API keys para el sistema de fallback automático');
  } else {
    recommendations.push(`Sistema Multi-API configurado con ${geminiApiKeys.length} API keys`);
  }
  
  // Validar cada API key
  geminiApiKeys.forEach((key, index) => {
    if (key.length < 20) {
      errors.push(`API key ${index + 1} parece inválida (muy corta)`);
    } else if (!key.startsWith('AIza')) {
      warnings.push(`API key ${index + 1} no tiene el formato esperado de Google AI`);
    }
  });
  
  // Validar API key legacy si existe
  if (legacyKey) {
    if (legacyKey.length < 20) {
      errors.push('API key legacy parece inválida (muy corta)');
    } else if (!legacyKey.startsWith('AIza')) {
      warnings.push('API key legacy no tiene el formato esperado de Google AI');
    }
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
  
  // Logging deshabilitado para producción
  
  return config;
};
