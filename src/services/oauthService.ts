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
  private readonly GITHUB_CONFIG = {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/auth/github/callback`,
    scope: ['user:email', 'read:user', 'repo', 'read:org'],
  };

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
    const params = new URLSearchParams({
      client_id: this.GITHUB_CONFIG.clientId,
      redirect_uri: this.GITHUB_CONFIG.redirectUri,
      scope: this.GITHUB_CONFIG.scope.join(' '),
      state,
    });

    // Guardar state para verificación posterior
    sessionStorage.setItem('github_oauth_state', state);
    
    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
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
   * Procesa el callback de GitHub
   */
  async handleGitHubCallback(code: string, state: string): Promise<OAuthResult> {
    try {
      // Verificar state
      const savedState = sessionStorage.getItem('github_oauth_state');
      if (savedState !== state) {
        throw new Error('Invalid state parameter');
      }

      // Intercambiar código por token directamente con GitHub
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.GITHUB_CONFIG.clientId,
          client_secret: import.meta.env.VITE_GITHUB_CLIENT_SECRET || '',
          code: code,
          redirect_uri: this.GITHUB_CONFIG.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error_description || data.error);
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
    return {
      github: !!this.GITHUB_CONFIG.clientId,
      linkedin: !!this.LINKEDIN_CONFIG.clientId,
    };
  }
}

export const oauthService = new OAuthService();
export default oauthService;
