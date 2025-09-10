import { getGitHubOAuthCredentials } from '@/config/github-oauth';
import { tokenStorage } from './tokenStorage';

interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
  state?: string;
}

interface OAuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string[];
  error?: string;
}

class OAuthService {
  private get GITHUB_CONFIG() {
    const credentials = getGitHubOAuthCredentials();
    return {
      clientId: credentials.clientId,
      redirectUri: 'http://localhost:8083/auth/github/callback', // URL fija para desarrollo
      scope: ['user:email', 'read:user', 'repo', 'read:org'],
    };
  }

  private readonly LINKEDIN_CONFIG = {
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/auth/linkedin/callback`,
    scope: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
  };

  /**
   * Inicia el flujo de OAuth para GitHub
   */
  initiateGitHubAuth(): void {
    const state = this.generateState();
    const config = this.GITHUB_CONFIG;
    const timestamp = Date.now();
    
    
    // Limpiar cualquier state anterior
    this.clearGitHubState();
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope.join(' '),
      state,
    });

    // Guardar state en múltiples ubicaciones para mayor robustez
    this.saveGitHubState(state, timestamp);
    
    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    
    window.location.href = authUrl;
  }

  /**
   * Inicia el flujo de OAuth para LinkedIn
   */
  initiateLinkedInAuth(): void {
    const state = this.generateState();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.LINKEDIN_CONFIG.clientId,
      redirect_uri: this.LINKEDIN_CONFIG.redirectUri,
      scope: this.LINKEDIN_CONFIG.scope.join(' '),
      state,
    });

    // Guardar state para verificación posterior
    sessionStorage.setItem('linkedin_oauth_state', state);
    
    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  /**
   * Procesa el callback de GitHub usando Supabase Edge Function
   */
  async handleGitHubCallback(code: string, state: string): Promise<OAuthResult> {
    try {
      // Verificar si ya hay un token válido
      const existingToken = tokenStorage.getGitHubToken();
      if (existingToken) {
        console.log('Token already exists, skipping token exchange');
        return {
          success: true,
          accessToken: existingToken,
          refreshToken: null,
          expiresIn: null,
          scope: [],
        };
      }

      // Verificar state con sistema robusto de recuperación
      const stateValidation = this.validateGitHubState(state);
      console.log('State validation:', {
        receivedState: state,
        isValid: stateValidation.isValid,
        source: stateValidation.source,
        timestamp: stateValidation.timestamp,
        age: stateValidation.timestamp ? Date.now() - stateValidation.timestamp : 'unknown'
      });
      
      if (!stateValidation.isValid) {
        console.error('State validation failed:', {
          received: state,
          validation: stateValidation,
          allSessionStorage: Object.keys(sessionStorage).filter(key => key.includes('oauth')),
          allLocalStorage: Object.keys(localStorage).filter(key => key.includes('github'))
        });
        throw new Error('Invalid state parameter - possible CSRF attack or expired session');
      }

      // Usar Supabase Edge Function para intercambiar código por token con retry logic
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL no está configurado');
      }


      // Implementar retry logic para el token exchange
      let data;
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Token exchange attempt ${attempt}/3`);
          
          const response = await fetch(`${supabaseUrl}/functions/v1/github-token-exchange`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              state,
            }),
          });

          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch {
              errorData = { error: 'Invalid response from server' };
            }
            
            const errorMessage = errorData.details || errorData.error || `Failed to exchange code for token (${response.status})`;
            console.warn(`Token exchange attempt ${attempt} failed:`, {
              status: response.status,
              error: errorMessage,
              errorData
            });
            
            if (attempt < 3) {
              // Esperar antes del siguiente intento (backoff exponencial)
              const delay = Math.pow(2, attempt - 1) * 1000;
              console.log(`Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              throw new Error(errorMessage);
            }
          }

          data = await response.json();
          
          if (data.error) {
            const errorMessage = data.details || data.error;
            console.warn(`Token exchange attempt ${attempt} returned error:`, errorMessage);
            
            if (attempt < 3) {
              const delay = Math.pow(2, attempt - 1) * 1000;
              console.log(`Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              throw new Error(errorMessage);
            }
          }
          
          // Si llegamos aquí, el intercambio fue exitoso
          console.log('Token exchange successful on attempt', attempt);
          break;
          
        } catch (error: any) {
          lastError = error;
          console.warn(`Token exchange attempt ${attempt} failed:`, error.message);
          
          if (attempt < 3) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      if (!data) {
        throw lastError || new Error('Token exchange failed after all attempts');
      }
      
      // Validar que el token recibido es válido
      if (!data.access_token) {
        throw new Error('No se recibió un token de acceso válido de GitHub');
      }

      // Verificar que el token funciona haciendo una llamada de prueba
      try {
        const validationResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (!validationResponse.ok) {
          console.warn('Token validation failed:', validationResponse.status, validationResponse.statusText);
          throw new Error('El token recibido no es válido o no tiene los permisos necesarios');
        }

        const userData = await validationResponse.json();
        console.log('Token validation successful for user:', userData.login);
      } catch (validationError: any) {
        console.error('Token validation error:', validationError);
        throw new Error('No se pudo validar el token de GitHub: ' + validationError.message);
      }

      // Limpiar state después de éxito
      this.clearGitHubState();

      return {
        success: true,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope?.split(' ') || [],
      };
    } catch (error: any) {
      console.error('GitHub OAuth callback error:', error);
      return {
        success: false,
        error: error.message || 'Error en la autenticación de GitHub',
      };
    }
  }

  /**
   * Procesa el callback de LinkedIn
   */
  async handleLinkedInCallback(code: string, state: string): Promise<OAuthResult> {
    try {
      // Verificar state
      const savedState = sessionStorage.getItem('linkedin_oauth_state');
      if (savedState !== state) {
        throw new Error('Invalid state parameter');
      }

      // Intercambiar código por token
      const response = await fetch('/api/auth/linkedin/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      
      // Limpiar state
      sessionStorage.removeItem('linkedin_oauth_state');

      return {
        success: true,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope?.split(' ') || [],
      };
    } catch (error: any) {
      console.error('LinkedIn OAuth callback error:', error);
      return {
        success: false,
        error: error.message || 'Error en la autenticación de LinkedIn',
      };
    }
  }

  /**
   * Genera un state aleatorio para OAuth
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Guarda el state de GitHub en múltiples ubicaciones para mayor robustez
   */
  private saveGitHubState(state: string, timestamp: number): void {
    const stateData = {
      state,
      timestamp,
      expiresAt: timestamp + (10 * 60 * 1000) // 10 minutos de expiración
    };

    try {
      // Guardar en sessionStorage (principal)
      sessionStorage.setItem('github_oauth_state', state);
      sessionStorage.setItem('github_oauth_timestamp', timestamp.toString());
      
      // Guardar en localStorage como backup
      localStorage.setItem('github_oauth_backup', JSON.stringify(stateData));
      
    } catch (error) {
      console.error('Error saving GitHub state:', error);
      throw new Error('No se pudo guardar el state de OAuth');
    }
  }

  /**
   * Valida el state de GitHub con sistema de recuperación
   */
  private validateGitHubState(receivedState: string): { 
    isValid: boolean; 
    source: 'session' | 'local' | 'none' | 'existing_token';
    timestamp?: number;
  } {
    try {
      // Verificar si ya hay un token válido (significa que el proceso ya fue exitoso)
      const existingToken = tokenStorage.getGitHubToken();
      if (existingToken) {
        console.log('Token already exists, allowing state validation to pass');
        return {
          isValid: true,
          source: 'existing_token',
          timestamp: Date.now()
        };
      }

      // Intentar validar desde sessionStorage primero
      const sessionState = sessionStorage.getItem('github_oauth_state');
      const sessionTimestamp = sessionStorage.getItem('github_oauth_timestamp');
      
      if (sessionState === receivedState) {
        const timestamp = sessionTimestamp ? parseInt(sessionTimestamp) : Date.now();
        const age = Date.now() - timestamp;
        
        // Verificar que no haya expirado (10 minutos)
        if (age < 10 * 60 * 1000) {
          return { isValid: true, source: 'session', timestamp };
        } else {
          console.warn('Session state expired:', { age, timestamp });
        }
      }

      // Intentar recuperar desde localStorage como backup
      const backupData = localStorage.getItem('github_oauth_backup');
      if (backupData) {
        try {
          const parsed = JSON.parse(backupData);
          const { state, timestamp, expiresAt } = parsed;
          
          if (state === receivedState && Date.now() < expiresAt) {
            console.log('State recovered from localStorage backup');
            return { isValid: true, source: 'local', timestamp };
          } else if (Date.now() >= expiresAt) {
            console.warn('Backup state expired:', { expiresAt, now: Date.now() });
            localStorage.removeItem('github_oauth_backup');
          }
        } catch (parseError) {
          console.warn('Error parsing backup state:', parseError);
          localStorage.removeItem('github_oauth_backup');
        }
      }

      return { isValid: false, source: 'none' };
    } catch (error) {
      console.error('Error validating GitHub state:', error);
      return { isValid: false, source: 'none' };
    }
  }

  /**
   * Limpia todos los datos de state de GitHub
   */
  private clearGitHubState(): void {
    try {
      sessionStorage.removeItem('github_oauth_state');
      sessionStorage.removeItem('github_oauth_timestamp');
      localStorage.removeItem('github_oauth_backup');
    } catch (error) {
      console.error('Error clearing GitHub state:', error);
    }
  }

  /**
   * Verifica si las configuraciones están completas
   */
  validateConfig(): { github: boolean; linkedin: boolean } {
    const githubValid = !!this.GITHUB_CONFIG.clientId && this.GITHUB_CONFIG.clientId.length > 0;
    const linkedinValid = !!this.LINKEDIN_CONFIG.clientId && this.LINKEDIN_CONFIG.clientId.length > 0;
    
    if (!githubValid) {
      console.warn('GitHub OAuth not configured: VITE_GITHUB_CLIENT_ID is missing or empty');
    }
    
    return {
      github: githubValid,
      linkedin: linkedinValid,
    };
  }
}

export const oauthService = new OAuthService();
export default oauthService;
