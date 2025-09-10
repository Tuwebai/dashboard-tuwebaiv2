import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGitHubAuth } from '../hooks/useGitHubAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const GitHubCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback, isConnected, error, isLoading } = useGitHubAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  // Prevenir múltiples ejecuciones del callback
  const isProcessing = useRef(false);
  const hasProcessed = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      // Prevenir múltiples ejecuciones
      if (isProcessing.current || hasProcessed.current) {
        console.log('Callback already processing or processed, skipping...');
        return;
      }

      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        

        // Marcar como procesando
        isProcessing.current = true;

        if (error) {
          setStatus('error');
          setMessage(`Error de autorización: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
          hasProcessed.current = true;
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No se recibió el código de autorización de GitHub');
          hasProcessed.current = true;
          return;
        }

        // Procesar el callback una sola vez
        try {
          console.log('Processing callback...');
          const result = await handleCallback(code, state || '');
          
          if (result.success) {
            setStatus('success');
            setMessage('¡Conexión con GitHub exitosa!');
            hasProcessed.current = true;
            
            // Redirigir al perfil después de 1 segundo
            setTimeout(() => {
              navigate('/perfil');
            }, 1000);
          } else {
            setStatus('error');
            setMessage(result.error || 'Error en la conexión con GitHub');
            hasProcessed.current = true;
          }
        } catch (err: any) {
          console.error('Callback error:', err);
          setStatus('error');
          setMessage(err.message || 'Error procesando la autorización');
          hasProcessed.current = true;
        }

      } catch (err: any) {
        console.error('Error procesando callback:', err);
        setStatus('error');
        setMessage(err.message || 'Error procesando la autorización');
        hasProcessed.current = true;
      } finally {
        isProcessing.current = false;
      }
    };

    processCallback();
  }, [searchParams, handleCallback, navigate]); // Removido isConnected del array de dependencias

  const handleRetry = () => {
    // Resetear flags y reintentar
    isProcessing.current = false;
    hasProcessed.current = false;
    setRetryCount(prev => prev + 1);
    setStatus('loading');
    setMessage('');
    
    // Forzar re-ejecución del useEffect
    window.location.reload();
  };

  const handleGoToProfile = () => {
    navigate('/perfil');
  };

  const handleManualRetry = () => {
    // Resetear y volver a iniciar el proceso
    isProcessing.current = false;
    hasProcessed.current = false;
    setRetryCount(0);
    setStatus('loading');
    setMessage('');
    
    // Redirigir de vuelta al perfil para reiniciar
    navigate('/perfil');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {status === 'loading' && 'Procesando autorización...'}
            {status === 'success' && '¡Autorización exitosa!'}
            {status === 'error' && 'Error de autorización'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-gray-600">Conectando con GitHub...</p>
              {retryCount > 0 && (
                <p className="text-sm text-gray-500">Intento {retryCount + 1} de 3</p>
              )}
              {isLoading && (
                <p className="text-sm text-blue-500">Procesando autorización...</p>
              )}
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">Redirigiendo al perfil...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-12 w-12 text-red-600" />
              <p className="text-gray-600">{message}</p>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 w-full">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col space-y-2 w-full">
                <Button onClick={handleRetry} variant="outline" className="w-full">
                  Reintentar Conexión
                </Button>
                <Button onClick={handleManualRetry} variant="outline" className="w-full">
                  Iniciar Nuevo Proceso
                </Button>
                <Button onClick={handleGoToProfile} className="w-full">
                  Ir al Perfil
                </Button>
              </div>
              
              {retryCount > 0 && (
                <p className="text-xs text-gray-500">
                  Se han realizado {retryCount} intentos. Si el problema persiste, 
                  verifica tu conexión a internet y las credenciales de GitHub.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GitHubCallback;
