// Configuración de GitHub OAuth para desarrollo y producción
// IMPORTANTE: En producción, usar variables de entorno

export const GITHUB_OAUTH_CONFIG = {
  // INSTRUCCIONES: 
  // 1. Ve a https://github.com/settings/developers
  // 2. Crea una nueva OAuth App
  // 3. Para desarrollo: http://localhost:8083/auth/github/callback
  // 4. Para producción: https://dashboard.tuweb-ai.com/auth/github/callback
  // 5. Reemplaza estos valores con tus credenciales reales:
  CLIENT_ID: 'your_github_client_id_here',
  CLIENT_SECRET: 'your_github_client_secret_here',
  REDIRECT_URI: 'http://localhost:8083/auth/github/callback',
  SCOPE: ['user:email', 'read:user', 'repo', 'read:org'],
};

// Función para obtener credenciales de GitHub OAuth
export const getGitHubOAuthCredentials = () => {
  // Intentar obtener de variables de entorno primero
  const envClientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const envClientSecret = import.meta.env.VITE_GITHUB_CLIENT_SECRET;
  const envRedirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;
  
  if (envClientId && envClientSecret) {
    return {
      clientId: envClientId,
      clientSecret: envClientSecret,
      redirectUri: envRedirectUri || (import.meta.env.PROD 
        ? 'https://dashboard.tuweb-ai.com/auth/github/callback'
        : 'http://localhost:8083/auth/github/callback'),
    };
  }
  
  // Fallback a configuración temporal (solo para desarrollo)
  console.warn('Using temporary GitHub OAuth configuration. Please set VITE_GITHUB_CLIENT_ID and VITE_GITHUB_CLIENT_SECRET in your .env file');
  
  return {
    clientId: GITHUB_OAUTH_CONFIG.CLIENT_ID,
    clientSecret: GITHUB_OAUTH_CONFIG.CLIENT_SECRET,
    redirectUri: GITHUB_OAUTH_CONFIG.REDIRECT_URI,
  };
};
