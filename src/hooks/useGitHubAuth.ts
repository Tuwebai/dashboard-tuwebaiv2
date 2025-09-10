import { useState, useCallback, useEffect } from 'react';
import { oauthService } from '@/services/oauthService';
import { tokenStorage } from '@/services/tokenStorage';
import { githubService } from '@/services/githubService';

interface UseGitHubAuthReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  validateConnection: () => Promise<boolean>;
  handleCallback: (code: string, state?: string) => Promise<void>;
}

export const useGitHubAuth = (): UseGitHubAuthReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar conexión al montar el hook
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const tokenInfo = tokenStorage.getTokenInfo('github');
      if (tokenInfo.isConnected) {
        // Verificar si el token sigue siendo válido
        const token = tokenStorage.getToken('github');
        if (token) {
          const isValid = await githubService.validateToken(token.accessToken);
          if (isValid) {
            setIsConnected(true);
            setError(null);
          } else {
            // Token expirado, desconectar
            tokenStorage.removeToken('github');
            setIsConnected(false);
            setError('Token de GitHub expirado');
          }
        } else {
          setIsConnected(false);
          setError('No se encontró token de GitHub');
        }
      } else {
        setIsConnected(false);
        setError(null);
      }
    } catch (error: any) {
      console.error('Error checking GitHub connection:', error);
      setError('Error verificando la conexión: ' + error.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Verificar configuración
      const config = oauthService.validateConfig();
      if (!config.github) {
        throw new Error('GitHub OAuth no está configurado correctamente. Verifica las variables de entorno VITE_GITHUB_CLIENT_ID y VITE_GITHUB_CLIENT_SECRET');
      }

      // Iniciar flujo de OAuth
      oauthService.initiateGitHubAuth();
    } catch (error: any) {
      console.error('Error connecting to GitHub:', error);
      setError(error.message || 'Error conectando con GitHub');
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    try {
      tokenStorage.removeToken('github');
      setIsConnected(false);
      setError(null);
    } catch (error: any) {
      console.error('Error disconnecting from GitHub:', error);
      setError('Error desconectando de GitHub');
    }
  }, []);

  const validateConnection = useCallback(async (): Promise<boolean> => {
    try {
      const token = tokenStorage.getToken('github');
      if (!token) {
        setIsConnected(false);
        return false;
      }

      const isValid = await githubService.validateToken(token.accessToken);
      if (!isValid) {
        tokenStorage.removeToken('github');
        setIsConnected(false);
        return false;
      }

      setIsConnected(true);
      return true;
    } catch (error: any) {
      console.error('Error validating GitHub connection:', error);
      setError('Error validando la conexión');
      setIsConnected(false);
      return false;
    }
  }, []);

  const handleCallback = useCallback(async (code: string, state?: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      // Procesar el callback de OAuth
      const tokenData = await oauthService.handleGitHubCallback(code, state);
      
      if (tokenData.success && tokenData.accessToken) {
        // Guardar el token
        tokenStorage.saveToken('github', {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: Date.now() + (tokenData.expiresIn || 3600) * 1000,
          scope: tokenData.scope || [],
        });
        
        // Verificar que el token funciona
        const isValid = await githubService.validateToken(tokenData.accessToken);
        if (isValid) {
          setIsConnected(true);
          setError(null);
        } else {
          throw new Error('El token obtenido no es válido');
        }
      } else {
        throw new Error(tokenData.error || 'No se pudo obtener el token de acceso');
      }
    } catch (error: any) {
      console.error('Error handling GitHub callback:', error);
      setError(error.message || 'Error procesando la autorización');
      setIsConnected(false);
      // Limpiar token si hay error
      tokenStorage.removeToken('github');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    validateConnection,
    handleCallback,
  };
};
