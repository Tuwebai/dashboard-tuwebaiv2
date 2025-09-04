import React, { Component, ErrorInfo, ReactNode } from 'react';

// =====================================================
// INTERFACES
// =====================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  maxRetries?: number;
  showErrorDetails?: boolean;
  className?: string;
}

interface ErrorMessageProps {
  error: Error;
  onRetry?: () => void;
  showDetails?: boolean;
  className?: string;
}

// =====================================================
// COMPONENTE ERROR BOUNDARY
// =====================================================

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generar ID único para el error
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, maxRetries = 3 } = this.props;
    const { errorId, retryCount } = this.state;

    // Actualizar estado con información del error
    this.setState({
      error,
      errorInfo
    });

    // Registrar error en performance monitor
    // Registrar error de forma segura
    if (typeof window !== 'undefined' && (window as any).performanceMonitor) {
      (window as any).performanceMonitor.recordError(error, 'ErrorBoundary');
    }

    // Llamar callback personalizado si existe
    if (onError) {
      onError(error, errorInfo, errorId);
    }

    // Log del error para debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Enviar error a servicio de logging si está disponible
    this.logErrorToService(error, errorInfo, errorId);

    // Auto-retry si no hemos excedido el máximo
    if (retryCount < maxRetries) {
      this.scheduleRetry();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetOnPropsChange = true, resetKeys = [] } = this.props;
    const { hasError } = this.state;

    // Reset si las props han cambiado y está habilitado
    if (hasError && resetOnPropsChange) {
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        prevProps.resetKeys?.[index] !== key
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private scheduleRetry(): void {
    const { retryCount } = this.state;
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState(prevState => ({
        retryCount: prevState.retryCount + 1
      }));
      this.resetErrorBoundary();
    }, delay);
  }

  private async logErrorToService(error: Error, errorInfo: ErrorInfo, errorId: string): Promise<void> {
    // Deshabilitado temporalmente - no hay endpoint de errores configurado
    // Solo loggear en consola en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId()
      });
    }
  }

  private getCurrentUserId(): string | null {
    // Obtener ID del usuario actual desde el contexto o localStorage
    try {
      return localStorage.getItem('userId') || null;
    } catch {
      return null;
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  private resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    });
  };

  private handleRetry = (): void => {
    this.resetErrorBoundary();
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReportBug = (): void => {
    const { error, errorId } = this.state;
    const bugReportUrl = `mailto:support@tuwebai.com?subject=Bug Report - ${errorId}&body=Error: ${error?.message}\n\nStack: ${error?.stack}\n\nError ID: ${errorId}`;
    window.open(bugReportUrl);
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state;
    const { children, fallback, showErrorDetails = false, className, maxRetries = 3 } = this.props;

    if (hasError) {
      // Usar fallback personalizado si se proporciona
      if (fallback) {
        return fallback;
      }

      // Renderizar UI de error por defecto
      return (
        <div className={`error-boundary ${className || ''}`}>
          <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-red-500">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                  ¡Oops! Algo salió mal
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
                </p>
                {errorId && (
                  <p className="mt-1 text-xs text-gray-500">
                    Error ID: {errorId}
                  </p>
                )}
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={this.handleRetry}
                    disabled={retryCount >= maxRetries}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {retryCount >= maxRetries ? 'Máximo de reintentos alcanzado' : 'Intentar de nuevo'}
                  </button>

                  <button
                    onClick={this.handleReload}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Recargar página
                  </button>

                  <button
                    onClick={this.handleReportBug}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reportar problema
                  </button>
                </div>

                {showErrorDetails && error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Detalles técnicos
                    </summary>
                    <div className="mt-2 p-4 bg-gray-100 rounded-md">
                      <div className="text-sm text-gray-800">
                        <div className="mb-2">
                          <strong>Error:</strong> {error.message}
                        </div>
                        {error.stack && (
                          <div className="mb-2">
                            <strong>Stack:</strong>
                            <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                        {errorInfo?.componentStack && (
                          <div>
                            <strong>Component Stack:</strong>
                            <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">
                              {errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// =====================================================
// HOOK PARA ERROR BOUNDARY
// =====================================================

export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error, context?: string) => {
    setError(error);
    // Registrar error de forma segura
    if (typeof window !== 'undefined' && (window as any).performanceMonitor) {
      (window as any).performanceMonitor.recordError(error, context);
    }
  }, []);

  // Si hay un error, lanzarlo para que sea capturado por el Error Boundary
  if (error) {
    throw error;
  }

  return { captureError, resetError };
};

// =====================================================
// COMPONENTE DE ERROR FALLBACK PERSONALIZADO
// =====================================================

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorId?: string;
}

export function ErrorFallback({ error, resetError, errorId }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-red-500 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error en el componente
          </h2>
          <p className="text-gray-600 mb-4">
            {error.message}
          </p>
          {errorId && (
            <p className="text-sm text-gray-500 mb-4">
              Error ID: {errorId}
            </p>
          )}
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// HOC PARA ERROR BOUNDARY
// =====================================================

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// =====================================================
// UTILIDADES DE ERROR HANDLING
// =====================================================

export const createErrorHandler = (context: string) => {
  return (error: Error) => {
    // Registrar error de forma segura
    if (typeof window !== 'undefined' && (window as any).performanceMonitor) {
      (window as any).performanceMonitor.recordError(error, context);
    }
    console.error(`Error in ${context}:`, error);
  };
};

export const handleAsyncError = async <T,>(
  asyncFn: () => Promise<T>,
  context: string
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    const errorHandler = createErrorHandler(context);
    errorHandler(error as Error);
    return null;
  }
};

export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  context: string
): T => {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // Si es una promesa, manejar errores asincrónicos
      if (result && typeof result.catch === 'function') {
        return result.catch((error: Error) => {
          createErrorHandler(context)(error);
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      createErrorHandler(context)(error as Error);
      throw error;
    }
  }) as T;
};

// =====================================================
// COMPONENTE ERROR MESSAGE
// =====================================================

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  error, 
  onRetry, 
  showDetails = false, 
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <div className="text-center">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-red-800 mb-2">
          Algo salió mal
        </h2>
        <p className="text-red-600 mb-4">
          {error.message || 'Ha ocurrido un error inesperado'}
        </p>
        
        {showDetails && (
          <details className="text-left bg-red-100 p-3 rounded border text-sm text-red-700 mb-4">
            <summary className="cursor-pointer font-medium">Detalles técnicos</summary>
            <pre className="mt-2 whitespace-pre-wrap text-xs">
              {error.stack}
            </pre>
          </details>
        )}
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
};