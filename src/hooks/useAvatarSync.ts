import { useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { realAvatarService } from '@/lib/avatarProviders';

/**
 * Hook para sincronizar automáticamente el avatar del usuario después del login
 */
export function useAvatarSync() {
  const { user } = useApp();

  useEffect(() => {
    const syncUserAvatar = async () => {
      if (user?.email) {
        try {
          // Sincronizar avatar del usuario actual
          await realAvatarService.syncUserAvatar(user.email);
        } catch (error) {
          console.error('❌ Error sincronizando avatar automáticamente:', error);
        }
      }
    };

    // Sincronizar avatar cuando el usuario cambie
    if (user) {
      syncUserAvatar();
    }
  }, [user]);

  return null;
}
