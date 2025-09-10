import { useState, useCallback, useEffect } from 'react';
import { oauthService } from '@/services/oauthService';
import { tokenStorage } from '@/services/tokenStorage';
import { linkedinService } from '@/services/linkedinService';

interface UseLinkedInAuthReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  validateConnection: () => Promise<boolean>;
}

export const useLinkedInAuth = (): UseLinkedInAuthReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar conexión al montar el hook
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const tokenInfo = tokenStorage.getTokenInfo('linkedin');
      if (tokenInfo.isConnected) {
        // Verificar si el token sigue siendo válido
        const token = tokenStorage.getToken('linkedin');
        if (token) {
          const isValid = await linkedinService.validateToken(token.accessToken);
          if (isValid) {
            setIsConnected(true);
            setError(null);
          } else {
            // Token expirado, desconectar
            tokenStorage.removeToken('linkedin');
            setIsConnected(false);
          }
        }
      } else {
        setIsConnected(false);
      }
    } catch (error: any) {
      console.error('Error checking LinkedIn connection:', error);
      setError('Error verificando la conexión');
      setIsConnected(false);
    }
  }, []);

  const connect = useCallback(() => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Verificar configuración
      const config = oauthService.validateConfig();
      if (!config.linkedin) {
        throw new Error('LinkedIn OAuth no está configurado correctamente');
      }

      // Iniciar flujo de OAuth
      oauthService.initiateLinkedInAuth();
    } catch (error: any) {
      console.error('Error connecting to LinkedIn:', error);
      setError(error.message || 'Error conectando con LinkedIn');
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    try {
      tokenStorage.removeToken('linkedin');
      setIsConnected(false);
      setError(null);
    } catch (error: any) {
      console.error('Error disconnecting from LinkedIn:', error);
      setError('Error desconectando de LinkedIn');
    }
  }, []);

  const validateConnection = useCallback(async (): Promise<boolean> => {
    try {
      const token = tokenStorage.getToken('linkedin');
      if (!token) {
        setIsConnected(false);
        return false;
      }

      const isValid = await linkedinService.validateToken(token.accessToken);
      if (!isValid) {
        tokenStorage.removeToken('linkedin');
        setIsConnected(false);
        return false;
      }

      setIsConnected(true);
      return true;
    } catch (error: any) {
      console.error('Error validating LinkedIn connection:', error);
      setError('Error validando la conexión');
      setIsConnected(false);
      return false;
    }
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    validateConnection,
  };
};
