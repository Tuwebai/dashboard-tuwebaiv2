// =====================================================
// SERVICIO SIMPLIFICADO PARA OBTENER AVATARES REALES
// =====================================================

import { supabase } from './supabase';

export interface AvatarResult {
  url: string;
  provider: string;
  isReal: boolean;
}

// =====================================================
// SERVICIO PRINCIPAL DE AVATARES
// =====================================================

export class RealAvatarService {
  
  // =====================================================
  // OBTENER AVATAR REAL DEL CORREO REGISTRADO
  // =====================================================

  async getRealAvatar(email: string): Promise<AvatarResult> {
    try {
      
      // 1. Intentar obtener avatar guardado en la base de datos
      const savedAvatar = await this.getSavedAvatar(email);
      if (savedAvatar && this.isRealAvatarUrl(savedAvatar)) {
        return {
          url: savedAvatar,
          provider: 'Database',
          isReal: true
        };
      }

      // 2. Intentar obtener avatar del usuario autenticado actual
      const authAvatar = await this.getAuthUserAvatar(email);
      if (authAvatar) {
        return {
          url: authAvatar,
          provider: 'Supabase Auth',
          isReal: true
        };
      }

      // 3. Generar avatar temporal como último recurso (ui-avatars.com)
      const tempAvatar = this.generateTemporaryAvatar(email);

      return {
        url: tempAvatar,
        provider: 'ui-avatars.com',
        isReal: false
      };

    } catch (error) {
      const tempAvatar = this.generateTemporaryAvatar(email);
      return {
        url: tempAvatar,
        provider: 'ui-avatars.com',
        isReal: false
      };
    }
  }

  // =====================================================
  // MÉTODOS PRIVADOS DE AYUDA
  // =====================================================

  private async getSavedAvatar(email: string): Promise<string | null> {
    try {
      
      const { data, error } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('email', email)
        .single();

      if (error) {
        return null;
      }

      if (!data?.avatar_url) {
        return null;
      }

      return data.avatar_url;
    } catch (error) {
      return null;
    }
  }

  private async getAuthUserAvatar(email: string): Promise<string | null> {
    try {
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return null;
      }

      if (!user) {
        return null;
      }

      if (user.email !== email) {
        return null;
      }

      // Obtener avatar de user_metadata (funciona con Google, GitHub, email/password)
      const avatarUrl = user.user_metadata?.avatar_url || 
                       user.user_metadata?.picture || 
                       user.user_metadata?.photoURL ||
                       user.user_metadata?.image;

      if (avatarUrl) {
        
        if (this.isRealAvatarUrl(avatarUrl)) {
          return avatarUrl;
        } else {
          return null;
        }
      } else {
        return null;
      }

    } catch (error) {
      return null;
    }
  }

  private isRealAvatarUrl(url: string): boolean {
    
    // Verificar si la URL es de un avatar real (no generado)
    const realProviders = [
      'googleusercontent.com',
      'githubusercontent.com',
      'gravatar.com',
      'yahoo.com',
      'outlook.com',
      'hotmail.com',
      'live.com'
    ];
    
    const generatedProviders = [
      'dicebear.com',
      'ui-avatars.com'
    ];

    const isReal = realProviders.some(provider => url.includes(provider));
    const isGenerated = generatedProviders.some(provider => url.includes(provider));

    return isReal && !isGenerated;
  }

  private generateTemporaryAvatar(email: string): string {
    // Usar ui-avatars.com como fallback
    const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Generar iniciales del email
    const initials = email.substring(0, 2).toUpperCase();
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${randomColor}&color=fff&size=200&font-size=0.8&bold=true&format=svg`;
  }

  // =====================================================
  // MÉTODOS PÚBLICOS PARA SINCRONIZACIÓN
  // =====================================================

  /**
   * Sincroniza el avatar de un usuario específico
   */
  async syncUserAvatar(email: string): Promise<void> {
    try {
      const avatarResult = await this.getRealAvatar(email);
      
      await this.saveAvatarToDatabase(email, avatarResult.url);
      
    } catch (error) {
      console.error(`❌ Error sincronizando avatar para ${email}:`, error);
    }
  }

  /**
   * Sincroniza todos los avatares de usuarios
   */
  async syncAllUserAvatars(): Promise<void> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('email');

      if (error || !users) {
        console.error('❌ Error obteniendo usuarios:', error);
        return;
      }

      for (const user of users) {
        await this.syncUserAvatar(user.email);
      }

    } catch (error) {
      console.error('❌ Error sincronizando avatares:', error);
    }
  }

  // =====================================================
  // GUARDAR AVATAR EN LA BASE DE DATOS
  // =====================================================

  private async saveAvatarToDatabase(email: string, avatarUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('email', email);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`❌ Error guardando avatar en DB para ${email}:`, error);
    }
  }
}

export const realAvatarService = new RealAvatarService();
export const { getRealAvatar, syncUserAvatar, syncAllUserAvatars } = realAvatarService;
