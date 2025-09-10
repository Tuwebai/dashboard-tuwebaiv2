import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGitHubAuth } from '../hooks/useGitHubAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const GitHubCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback, isConnected, error } = useGitHubAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(`Error de autorización: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No se recibió el código de autorización de GitHub');
          return;
        }

        // Procesar el callback
        await handleCallback(code, state || '');
        
        if (isConnected) {
          setStatus('success');
          setMessage('¡Conexión con GitHub exitosa!');
          
          // Redirigir al perfil después de 2 segundos
          setTimeout(() => {
            navigate('/perfil');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('No se pudo establecer la conexión con GitHub');
        }

      } catch (err: any) {
        console.error('Error procesando callback:', err);
        setStatus('error');
        setMessage(err.message || 'Error procesando la autorización');
      }
    };

    processCallback();
  }, [searchParams, handleCallback, navigate, isConnected]);

  const handleRetry = () => {
    navigate('/perfil');
  };

  const handleGoToProfile = () => {
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
              <div className="flex space-x-2">
                <Button onClick={handleRetry} variant="outline">
                  Reintentar
                </Button>
                <Button onClick={handleGoToProfile}>
                  Ir al Perfil
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GitHubCallback;
