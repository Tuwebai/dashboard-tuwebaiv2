import { toast } from '@/hooks/use-toast';

// Tipos de errores comunes
export interface AppError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
  status?: number;
}

// Clase para manejo de errores de la aplicación
export class AppErrorHandler {
  private static instance: AppErrorHandler;
  
  public static getInstance(): AppErrorHandler {
    if (!AppErrorHandler.instance) {
      AppErrorHandler.instance = new AppErrorHandler();
    }
    return AppErrorHandler.instance;
  }

  // Manejar errores de Supabase
  handleSupabaseError(error: any, context: string = 'Operación'): void {
    console.error(`❌ [${context}] Error:`, error);

    if (error?.code === 'PGRST301' || error?.message?.includes('CORS')) {
      this.handleCORSError(context);
      return;
    }

    if (error?.code === 'PGRST116') {
      this.handleAuthError(context);
      return;
    }

    if (error?.code === '42501') {
      this.handleRLSError(context);
      return;
    }

    if (error?.code === '23505') {
      this.handleDuplicateError(context);
      return;
    }

    if (error?.code === '23503') {
      this.handleForeignKeyError(context);
      return;
    }

    // Error genérico
    this.handleGenericError(error, context);
  }

  // Manejar errores de CORS
  private handleCORSError(context: string): void {
    setTimeout(() => {
      toast({
        title: "Error de Conexión",
        description: `No se pudo conectar con el servidor. Verifica tu conexión a internet y las variables de entorno.`,
        variant: "destructive",
      });
    }, 0);
    
    console.error(`🚫 [${context}] Error de CORS - Verificar configuración de Supabase`);
  }

  // Manejar errores de autenticación
  private handleAuthError(context: string): void {
    setTimeout(() => {
      toast({
        title: "Error de Autenticación",
        description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
        variant: "destructive",
      });
    }, 0);
    
    console.error(`🔐 [${context}] Error de autenticación`);
  }

  // Manejar errores de duplicado
  private handleDuplicateError(context: string): void {
    setTimeout(() => {
      toast({
        title: "Elemento Duplicado",
        description: "Ya existe un elemento con estos datos. Intenta con información diferente.",
        variant: "destructive",
      });
    }, 0);
    
    console.error(`🔄 [${context}] Error de duplicado`);
  }

  // Manejar errores de RLS (Row Level Security)
  private handleRLSError(context: string): void {
    setTimeout(() => {
      toast({
        title: "Error de Permisos",
        description: "No tienes permisos para realizar esta acción. Contacta al administrador si necesitas acceso.",
        variant: "destructive",
      });
    }, 0);
    
    console.error(`🔒 [${context}] Error de Row Level Security - Verificar políticas RLS`);
  }

  // Manejar errores de clave foránea
  private handleForeignKeyError(context: string): void {
    setTimeout(() => {
      toast({
        title: "Error de Referencia",
        description: "No se puede realizar esta acción porque hay datos relacionados.",
        variant: "destructive",
      });
    }, 0);
    
    console.error(`🔗 [${context}] Error de clave foránea`);
  }

  // Manejar errores genéricos
  public handleGenericError(error: any, context: string): void {
    const message = error?.message || error?.details || 'Error desconocido';
    
    // No mostrar toast para errores de conexión
    if (message?.includes('Failed to fetch') || message?.includes('ERR_CONNECTION_CLOSED')) {
      return;
    }
    
    // Usar setTimeout para evitar ejecutar toast durante el render
    setTimeout(() => {
      toast({
        title: "Error",
        description: `${context}: ${message}`,
        variant: "destructive",
      });
    }, 0);
    
    console.error(`⚠️ [${context}] Error genérico:`, message);
  }

  // Manejar errores de red
  handleNetworkError(context: string = 'Operación'): void {
    setTimeout(() => {
      toast({
        title: "Error de Red",
        description: "No se pudo conectar con el servidor. Verifica tu conexión a internet.",
        variant: "destructive",
      });
    }, 0);
    
    console.error(`🌐 [${context}] Error de red`);
  }

  // Manejar errores de validación
  handleValidationError(errors: string[], context: string = 'Validación'): void {
    const message = errors.length > 0 ? errors.join(', ') : 'Datos inválidos';
    
    setTimeout(() => {
      toast({
        title: "Error de Validación",
        description: message,
        variant: "destructive",
      });
    }, 0);
    
    console.error(`✅ [${context}] Error de validación:`, errors);
  }

  // Manejar errores de permisos
  handlePermissionError(context: string = 'Operación'): void {
    setTimeout(() => {
      toast({
        title: "Sin Permisos",
        description: "No tienes permisos para realizar esta acción.",
        variant: "destructive",
      });
    }, 0);
    
    console.error(`🚫 [${context}] Error de permisos`);
  }
}

// Instancia global del manejador de errores
export const errorHandler = AppErrorHandler.getInstance();

// Función de utilidad para manejar errores de Supabase
export const handleSupabaseError = (error: any, context: string = 'Operación') => {
  errorHandler.handleSupabaseError(error, context);
};

// Función de utilidad para manejar errores de red
export const handleNetworkError = (context: string = 'Operación') => {
  errorHandler.handleNetworkError(context);
};

// Función de utilidad para manejar errores de validación
export const handleValidationError = (errors: string[], context: string = 'Validación') => {
  errorHandler.handleValidationError(errors, context);
};

// Función de utilidad para manejar errores de permisos
export const handlePermissionError = (context: string = 'Operación') => {
  errorHandler.handlePermissionError(context);
};

// Configurar manejo global de errores
export const setupErrorHandler = () => {
  // Manejar errores no capturados
  window.addEventListener('error', (event) => {
    console.error('🚨 Error global no capturado:', event.error);
    errorHandler.handleGenericError(event.error, 'Error Global');
  });

  // Manejar promesas rechazadas
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Promesa rechazada no manejada:', event.reason);
    errorHandler.handleGenericError(event.reason, 'Promesa Rechazada');
  });

};

// Función para crear fallbacks de error
export const createErrorFallback = (error: AppError, onRetry?: () => void) => {
  return {
    title: getErrorTitle(error),
    message: error.message,
    hint: error.hint,
    isRecoverable: isRecoverableError(error),
    onRetry
  };
};

// Función para obtener el título del error
const getErrorTitle = (error: AppError): string => {
  if (error.code === 'PGRST301' || error.message?.includes('CORS')) {
    return 'Error de Conexión';
  }
  if (error.code === 'PGRST116') {
    return 'Error de Autenticación';
  }
  if (error.code === '23505') {
    return 'Elemento Duplicado';
  }
  if (error.code === '23503') {
    return 'Error de Referencia';
  }
  return 'Error';
};

// Función para determinar si el error es recuperable
const isRecoverableError = (error: AppError): boolean => {
  if (error.code === 'PGRST301' || error.message?.includes('CORS')) {
    return true;
  }
  if (error.code === 'PGRST116') {
    return true;
  }
  return false;
};

export default errorHandler;