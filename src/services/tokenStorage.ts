import CryptoJS from 'crypto-js';

interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope: string[];
  provider: 'github' | 'linkedin';
}

class TokenStorageService {
  private readonly SECRET_KEY = this.getOrGenerateSecretKey();
  private readonly STORAGE_PREFIX = 'social_tokens_';

  /**
   * Obtiene o genera una clave de encriptación
   */
  private getOrGenerateSecretKey(): string {
    // Primero intentar obtener de variables de entorno
    const envKey = import.meta.env.VITE_ENCRYPTION_KEY;
    if (envKey && envKey.length >= 32) {
      return envKey;
    }

    // Si no existe, generar una nueva y guardarla
    const storageKey = 'app_encryption_key';
    let storedKey = localStorage.getItem(storageKey);
    
    if (!storedKey || storedKey.length < 32) {
      // Generar una nueva key de 32 caracteres
      storedKey = this.generateRandomKey(32);
      localStorage.setItem(storageKey, storedKey);
    }
    
    return storedKey;
  }

  /**
   * Genera una clave aleatoria segura
   */
  private generateRandomKey(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Encripta un token antes de guardarlo
   */
  private encryptToken(token: string): string {
    return CryptoJS.AES.encrypt(token, this.SECRET_KEY).toString();
  }

  /**
   * Desencripta un token
   */
  private decryptToken(encryptedToken: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, this.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Guarda un token de forma segura
   */
  saveToken(provider: 'github' | 'linkedin', tokenData: Omit<StoredToken, 'provider'>): void {
    try {
      const tokenToStore: StoredToken = {
        ...tokenData,
        provider,
        accessToken: this.encryptToken(tokenData.accessToken),
        refreshToken: tokenData.refreshToken ? this.encryptToken(tokenData.refreshToken) : undefined,
      };

      localStorage.setItem(
        `${this.STORAGE_PREFIX}${provider}`,
        JSON.stringify(tokenToStore)
      );
    } catch (error) {
      console.error(`Error saving ${provider} token:`, error);
      throw new Error(`No se pudo guardar el token de ${provider}`);
    }
  }

  /**
   * Obtiene un token guardado
   */
  getToken(provider: 'github' | 'linkedin'): StoredToken | null {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}${provider}`);
      if (!stored) return null;

      const tokenData: StoredToken = JSON.parse(stored);
      
      // Verificar si el token ha expirado
      if (Date.now() >= tokenData.expiresAt) {
        this.removeToken(provider);
        return null;
      }

      return {
        ...tokenData,
        accessToken: this.decryptToken(tokenData.accessToken),
        refreshToken: tokenData.refreshToken ? this.decryptToken(tokenData.refreshToken) : undefined,
      };
    } catch (error) {
      console.error(`Error getting ${provider} token:`, error);
      this.removeToken(provider);
      return null;
    }
  }

  /**
   * Verifica si un token existe y no ha expirado
   */
  hasValidToken(provider: 'github' | 'linkedin'): boolean {
    const token = this.getToken(provider);
    return token !== null && Date.now() < token.expiresAt;
  }

  /**
   * Elimina un token
   */
  removeToken(provider: 'github' | 'linkedin'): void {
    localStorage.removeItem(`${this.STORAGE_PREFIX}${provider}`);
  }

  /**
   * Elimina todos los tokens
   */
  clearAllTokens(): void {
    this.removeToken('github');
    this.removeToken('linkedin');
  }

  /**
   * Obtiene información del token sin desencriptar el access token
   */
  getTokenInfo(provider: 'github' | 'linkedin'): { isConnected: boolean; expiresAt?: number; scope?: string[] } {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}${provider}`);
      if (!stored) return { isConnected: false };

      const tokenData: StoredToken = JSON.parse(stored);
      const isExpired = Date.now() >= tokenData.expiresAt;

      return {
        isConnected: !isExpired,
        expiresAt: tokenData.expiresAt,
        scope: tokenData.scope,
      };
    } catch (error) {
      return { isConnected: false };
    }
  }
}

export const tokenStorage = new TokenStorageService();
export default tokenStorage;
