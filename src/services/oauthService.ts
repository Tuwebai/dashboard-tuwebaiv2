import { getGitHubOAuthCredentials } from '@/config/github-oauth';

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
      redirectUri: credentials.redirectUri || `${window.location.origin}/auth/github/callback`,
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
    
    console.log('Initiating GitHub OAuth with config:', {
      clientId: config.clientId ? '***' + config.clientId.slice(-4) : 'MISSING',
      redirectUri: config.redirectUri,
      scope: config.scope,
      state: state.slice(0, 8) + '...'
    });
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope.join(' '),
      state,
    });

    // Guardar state para verificación posterior
    sessionStorage.setItem('github_oauth_state', state);
    
    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    console.log('Redirecting to GitHub OAuth:', authUrl);
    
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
   * Procesa el callback de GitHub usando Supabase Edge Function o fallback directo
   */
  async handleGitHubCallback(code: string, state: string): Promise<OAuthResult> {
    try {
      // Verificar state
      const savedState = sessionStorage.getItem('github_oauth_state');
      if (savedState !== state) {
        throw new Error('Invalid state parameter');
      }

      // Intentar usar Supabase Edge Function primero
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
        try {
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

          if (response.ok) {
            const data = await response.json();
            
            if (data.error) {
              throw new Error(data.details || data.error);
            }
            
            // Limpiar state
            sessionStorage.removeItem('github_oauth_state');

            return {
              success: true,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              expiresIn: data.expires_in,
              scope: data.scope?.split(' ') || [],
            };
          } else {
            console.warn('Supabase Edge Function failed, trying direct approach...');
          }
        } catch (edgeFunctionError) {
          console.warn('Supabase Edge Function error, trying direct approach:', edgeFunctionError);
        }
      }

      // Fallback: Intercambio directo con GitHub (solo para desarrollo)
      console.warn('Using direct GitHub token exchange (development only)');
      
      const credentials = getGitHubOAuthCredentials();
      
      if (!credentials.clientId || !credentials.clientSecret || 
          credentials.clientId === 'your_github_client_id_here' || 
          credentials.clientSecret === 'your_github_client_secret_here') {
        throw new Error('GitHub OAuth credentials not configured. Please set VITE_GITHUB_CLIENT_ID and VITE_GITHUB_CLIENT_SECRET in your .env file or update the configuration in src/config/github-oauth.ts');
      }

      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          code: code,
          redirect_uri: credentials.redirectUri,
          state: state || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`GitHub token exchange failed: ${response.status} - ${errorData}`);
      }

      const tokenData = await response.json();
      
      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }
      
      // Limpiar state
      sessionStorage.removeItem('github_oauth_state');

      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope?.split(' ') || [],
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
