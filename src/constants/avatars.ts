// Constantes para avatares
export const DEFAULT_AVATAR_URL = '/src/assets/images/AVATARPORDEFECTO.jpg';

// Función para verificar si un avatar es el por defecto
export const isDefaultAvatar = (avatarUrl: string | null | undefined): boolean => {
  if (!avatarUrl) return true;
  return avatarUrl.includes('AVATARPORDEFECTO.jpg') || 
         avatarUrl.includes('ui-avatars.com') ||
         avatarUrl.includes('gravatar.com/avatar');
};

// Función para obtener el avatar por defecto
export const getDefaultAvatar = (): string => {
  return DEFAULT_AVATAR_URL;
};
