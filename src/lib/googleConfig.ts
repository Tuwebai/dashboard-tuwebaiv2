// Configuración de Google OAuth
export const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  scopes: {
    calendar: 'https://www.googleapis.com/auth/calendar',
    gmail: 'https://www.googleapis.com/auth/gmail.send'
  },
  redirectUri: window.location.origin,
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
};

// Verificar configuración
export const validateGoogleConfig = () => {
  if (!GOOGLE_CONFIG.clientId) {
    console.error('❌ VITE_GOOGLE_CLIENT_ID no está configurado');
    return false;
  }
  console.log('✅ Google Client ID configurado:', GOOGLE_CONFIG.clientId);
  return true;
};

// Generar URL de autenticación
export const generateAuthUrl = (scope: string) => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CONFIG.clientId,
    redirect_uri: GOOGLE_CONFIG.redirectUri,
    scope: scope,
    response_type: 'token',
    access_type: 'offline'
  });
  
  return `${GOOGLE_CONFIG.authUrl}?${params.toString()}`;
};
