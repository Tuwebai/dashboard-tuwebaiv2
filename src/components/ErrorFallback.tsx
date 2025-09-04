import React from 'react';
import { AlertTriangle, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createErrorFallback, SupabaseError } from '@/lib/errorHandler';

interface ErrorFallbackProps {
  error: SupabaseError;
  component: string;
  action: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  className?: string;
}

export default function ErrorFallback({
  error,
  component,
  action,
  onRetry,
  onGoBack,
  onGoHome,
  showDetails = false,
  className = ''
}: ErrorFallbackProps) {
  const errorFallback = createErrorFallback(error, onRetry);

  const getErrorIcon = (code: string) => {
    switch (code) {
      case '42501':
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
      case '42P01':
      case '42703':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case '08000':
      case '57014':
        return <Info className="w-6 h-6 text-blue-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
    }
  };

  const getErrorColor = (code: string) => {
    switch (code) {
      case '42501':
        return 'border-orange-200 bg-orange-50';
      case '42P01':
      case '42703':
        return 'border-red-200 bg-red-50';
      case '08000':
      case '57014':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <Card className={`w-full ${getErrorColor(error.code)} ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          {getErrorIcon(error.code)}
          <div className="flex-1">
            <CardTitle className="text-lg text-slate-800">
              Error en {component}
            </CardTitle>
            <p className="text-sm text-slate-600">
              Acción: {action}
            </p>
          </div>
          <Badge 
            variant={errorFallback.isRecoverable ? "default" : "destructive"}
            className="text-xs"
          >
            {error.code}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-slate-700 font-medium">
            {errorFallback.message}
          </p>
          {errorFallback.hint && (
            <p className="text-sm text-slate-600 bg-slate-100 p-3 rounded-lg">
              💡 {errorFallback.hint}
            </p>
          )}
        </div>

        {showDetails && error.details && (
          <details className="bg-slate-50 p-3 rounded-lg">
            <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-800 font-medium">
              🔍 Ver detalles técnicos
            </summary>
            <pre className="mt-2 text-xs text-slate-700 whitespace-pre-wrap overflow-auto max-h-32">
              {error.details}
            </pre>
          </details>
        )}

        <div className="flex flex-wrap gap-2">
          {errorFallback.isRecoverable && onRetry && (
            <Button 
              onClick={onRetry}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          )}
          
          {onGoBack && (
            <Button 
              onClick={onGoBack}
              variant="outline"
              size="sm"
            >
              Volver Atrás
            </Button>
          )}
          
          {onGoHome && (
            <Button 
              onClick={onGoHome}
              variant="outline"
              size="sm"
            >
              Ir al Inicio
            </Button>
          )}
        </div>

        <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded">
          <p><strong>Componente:</strong> {component}</p>
          <p><strong>Acción:</strong> {action}</p>
          <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de error simple para listas vacías o estados de error menores
export function SimpleErrorFallback({
  message,
  hint,
  onRetry,
  className = ''
}: {
  message: string;
  hint?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-slate-700 mb-2">
        {message}
      </h3>
      {hint && (
        <p className="text-slate-500 mb-4">
          {hint}
        </p>
      )}
      {onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      )}
    </div>
  );
}

// Componente de error para formularios
export function FormErrorFallback({
  error,
  onRetry,
  className = ''
}: {
  error: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-800 font-medium">
            Error en el formulario
          </p>
          <p className="text-sm text-red-700 mt-1">
            {error}
          </p>
          {onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
