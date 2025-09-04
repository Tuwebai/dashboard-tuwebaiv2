import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface SupabaseErrorProps {
  error: string;
  onRetry?: () => void;
}

export function SupabaseError({ error, onRetry }: SupabaseErrorProps) {
  const isApiKeyError = error.includes('Invalid API key') || error.includes('Clave API de Supabase inválida');
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-md w-full mx-4">
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error de Configuración</AlertTitle>
          <AlertDescription className="mt-2">
            {isApiKeyError ? (
              <div className="space-y-3">
                <p>La clave API de Supabase no es válida o ha expirado.</p>
                <div className="text-sm space-y-2">
                  <p><strong>Posibles soluciones:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Verifica que la clave API en el archivo .env sea correcta</li>
                    <li>Asegúrate de que la clave API no esté truncada</li>
                    <li>Verifica que el proyecto de Supabase esté activo</li>
                    <li>Regenera la clave API en el dashboard de Supabase</li>
                  </ul>
                </div>
              </div>
            ) : (
              <p>{error}</p>
            )}
          </AlertDescription>
        </Alert>
        
        {onRetry && (
          <div className="mt-4 flex justify-center">
            <Button onClick={onRetry} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
