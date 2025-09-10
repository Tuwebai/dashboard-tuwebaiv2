import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class IntegrationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Integration Error Boundary caught an error:', error, errorInfo);
    
    // Llamar callback de error si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReportError = () => {
    // Aquí podrías enviar el error a un servicio de monitoreo
    console.error('Error reported:', this.state.error);
    // Ejemplo: errorReportingService.report(this.state.error);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="w-5 h-5" />
              <span>Error en la integración</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-medium mb-2">Algo salió mal al cargar los datos:</p>
                <p className="text-xs font-mono bg-red-100 dark:bg-red-900/30 p-2 rounded">
                  {this.state.error?.message || 'Error desconocido'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="text-red-700 border-red-300 hover:bg-red-100 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
                
                <Button
                  onClick={this.handleReportError}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Reportar error
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:underline">
                    Detalles técnicos (solo en desarrollo)
                  </summary>
                  <pre className="text-xs text-red-600 dark:text-red-400 mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook para usar el error boundary
export const useIntegrationError = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const reportError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
    setError(error);
    console.error('Integration error reported:', error, errorInfo);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    reportError,
    clearError
  };
};
