import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

// Configuración del cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Configuración de sesión
export const SESSION_CONFIG = {
  // Tiempo de vida de la sesión (en minutos)
  LIFETIME_MINUTES: 60,
  
  // Tiempo antes de expirar para mostrar advertencia (en minutos)
  WARNING_BEFORE_EXPIRY: 5,
  
  // Tiempo para renovación automática (en minutos)
  AUTO_RENEWAL_BEFORE_EXPIRY: 10,
  
  // Intervalo de verificación de sesión (en segundos)
  CHECK_INTERVAL_SECONDS: 30,
  
  // Máximo número de sesiones concurrentes por usuario
  MAX_CONCURRENT_SESSIONS: 3
};

// Estados de la sesión
export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired',
  INVALID = 'invalid'
}

// Interfaz para la información de sesión
export interface SessionInfo {
  id: string;
  userId: string;
  email: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  status: SessionStatus;
  isRenewable: boolean;
}

// Interfaz para eventos de sesión
export interface SessionEvent {
  type: 'expiring_soon' | 'expired' | 'renewed' | 'invalid';
  message: string;
  timestamp: Date;
  sessionInfo?: SessionInfo;
}

// Clase principal del gestor de sesiones
export class SessionManager {
  private static instance: SessionManager;
  private checkInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, (event: SessionEvent) => void> = new Map();
  private currentSession: SessionInfo | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Inicializa el gestor de sesiones
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Verificar sesión existente
      await this.checkCurrentSession();
      
      // Iniciar verificación periódica
      this.startPeriodicCheck();
      
      // Configurar listeners para cambios de autenticación
      this.setupAuthListeners();
      
      this.isInitialized = true;

    } catch (error) {
      console.error('Error inicializando SessionManager:', error);
      throw error;
    }
  }

  /**
   * Configura listeners para cambios de autenticación
   */
  private setupAuthListeners(): void {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      switch (event) {
        case 'SIGNED_IN':
          await this.handleSignIn(session);
          break;
        case 'SIGNED_OUT':
          await this.handleSignOut();
          break;
        case 'TOKEN_REFRESHED':
          await this.handleTokenRefresh(session);
          break;
        case 'USER_UPDATED':
          await this.handleUserUpdate(session);
          break;
      }
    });
  }

  /**
   * Maneja el inicio de sesión
   */
  private async handleSignIn(session: any): Promise<void> {
    if (!session?.user) return;

    try {
      const sessionInfo = await this.createSessionInfo(session);
      this.currentSession = sessionInfo;
      
      // Registrar sesión en la base de datos
      await this.recordSession(sessionInfo);
      
      // Emitir evento
      this.emitEvent({
        type: 'renewed',
        message: 'Sesión iniciada correctamente',
        timestamp: new Date(),
        sessionInfo
      });


    } catch (error) {
      console.error('Error manejando inicio de sesión:', error);
    }
  }

  /**
   * Maneja el cierre de sesión
   */
  private async handleSignOut(): Promise<void> {
    try {
      if (this.currentSession) {
        // Marcar sesión como terminada en la base de datos
        await this.terminateSession(this.currentSession.id);
        
        // Emitir evento
        this.emitEvent({
          type: 'expired',
          message: 'Sesión cerrada',
          timestamp: new Date(),
          sessionInfo: this.currentSession
        });
      }
      
      this.currentSession = null;

    } catch (error) {
      console.error('Error manejando cierre de sesión:', error);
    }
  }

  /**
   * Maneja la renovación del token
   */
  private async handleTokenRefresh(session: any): Promise<void> {
    if (!session?.user || !this.currentSession) return;

    try {
      // Actualizar información de sesión
      this.currentSession.lastActivity = new Date();
      this.currentSession.expiresAt = new Date(session.expires_at! * 1000);
      this.currentSession.status = SessionStatus.ACTIVE;
      
      // Actualizar en la base de datos
      await this.updateSessionActivity(this.currentSession.id);
      

    } catch (error) {
      console.error('Error manejando renovación de token:', error);
    }
  }

  /**
   * Maneja la actualización del usuario
   */
  private async handleUserUpdate(session: any): Promise<void> {
    if (!session?.user || !this.currentSession) return;

    try {
      // Actualizar información del usuario en la sesión
      this.currentSession.email = session.user.email || this.currentSession.email;
      this.currentSession.lastActivity = new Date();
      
      // Actualizar en la base de datos
      await this.updateSessionUser(this.currentSession.id, session.user);
      

    } catch (error) {
      console.error('Error manejando actualización de usuario:', error);
    }
  }

  /**
   * Verifica la sesión actual
   */
  async checkCurrentSession(): Promise<SessionInfo | null> {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        this.currentSession = null;
        return null;
      }

      const sessionInfo = await this.createSessionInfo(session);
      this.currentSession = sessionInfo;
      
      return sessionInfo;
    } catch (error) {
      console.error('Error verificando sesión actual:', error);
      this.currentSession = null;
      return null;
    }
  }

  /**
   * Crea información de sesión desde el objeto de sesión de Supabase
   */
  private async createSessionInfo(session: any): Promise<SessionInfo> {
    const now = new Date();
    const expiresAt = new Date(session.expires_at! * 1000);
    const status = this.calculateSessionStatus(expiresAt);
    
    // Obtener rol del usuario
    const role = await this.getUserRole(session.user.id);
    
    return {
      id: session.access_token,
      userId: session.user.id,
      email: session.user.email!,
      role,
      createdAt: new Date(session.created_at! * 1000),
      expiresAt,
      lastActivity: now,
      status,
      isRenewable: this.canRenewSession(expiresAt)
    };
  }

  /**
   * Calcula el estado de la sesión
   */
  private calculateSessionStatus(expiresAt: Date): SessionStatus {
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const warningThreshold = SESSION_CONFIG.WARNING_BEFORE_EXPIRY * 60 * 1000;
    
    if (timeUntilExpiry <= 0) {
      return SessionStatus.EXPIRED;
    } else if (timeUntilExpiry <= warningThreshold) {
      return SessionStatus.EXPIRING_SOON;
    } else {
      return SessionStatus.ACTIVE;
    }
  }

  /**
   * Verifica si la sesión puede ser renovada
   */
  private canRenewSession(expiresAt: Date): boolean {
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const renewalThreshold = SESSION_CONFIG.AUTO_RENEWAL_BEFORE_EXPIRY * 60 * 1000;
    
    return timeUntilExpiry > 0 && timeUntilExpiry <= renewalThreshold;
  }

  /**
   * Obtiene el rol del usuario
   */
  private async getUserRole(userId: string): Promise<string> {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return 'user'; // Rol por defecto
      }

      return data.role || 'user';
    } catch (error) {
      console.error('Error obteniendo rol del usuario:', error);
      return 'user';
    }
  }

  /**
   * Inicia la verificación periódica de la sesión
   */
  private startPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      await this.performPeriodicCheck();
    }, SESSION_CONFIG.CHECK_INTERVAL_SECONDS * 1000);
  }

  /**
   * Realiza la verificación periódica de la sesión
   */
  private async performPeriodicCheck(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const now = new Date();
      const timeUntilExpiry = this.currentSession.expiresAt.getTime() - now.getTime();
      
      // Verificar si la sesión está por expirar
      if (timeUntilExpiry <= SESSION_CONFIG.WARNING_BEFORE_EXPIRY * 60 * 1000) {
        if (timeUntilExpiry > 0) {
          // Mostrar advertencia
          this.emitEvent({
            type: 'expiring_soon',
            message: `Tu sesión expirará en ${Math.ceil(timeUntilExpiry / 60000)} minutos`,
            timestamp: now,
            sessionInfo: this.currentSession
          });
          
          // Mostrar toast de advertencia
          toast({
            title: 'Sesión por expirar',
            description: `Tu sesión expirará en ${Math.ceil(timeUntilExpiry / 60000)} minutos. ¿Deseas renovarla?`,
            variant: 'warning',
            action: {
              label: 'Renovar',
              onClick: () => this.renewSession()
            }
          });
        } else {
          // Sesión expirada
          this.currentSession.status = SessionStatus.EXPIRED;
          this.emitEvent({
            type: 'expired',
            message: 'Tu sesión ha expirado',
            timestamp: now,
            sessionInfo: this.currentSession
          });
          
          // Cerrar sesión automáticamente
          await this.forceSignOut();
        }
      }
      
      // Verificar si se puede renovar automáticamente
      if (this.currentSession.isRenewable && this.currentSession.status === SessionStatus.ACTIVE) {
        await this.renewSession();
      }
      
    } catch (error) {
      console.error('Error en verificación periódica:', error);
    }
  }

  /**
   * Renueva la sesión actual
   */
  async renewSession(): Promise<boolean> {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        throw new Error('Error renovando sesión');
      }

      // Actualizar información de sesión
      const sessionInfo = await this.createSessionInfo(data.session);
      this.currentSession = sessionInfo;
      
      // Actualizar en la base de datos
      await this.updateSessionActivity(sessionInfo.id);
      
      // Emitir evento
      this.emitEvent({
        type: 'renewed',
        message: 'Sesión renovada correctamente',
        timestamp: new Date(),
        sessionInfo
      });


      return true;
    } catch (error) {
      console.error('Error renovando sesión:', error);
      
      // Emitir evento de error
      this.emitEvent({
        type: 'invalid',
        message: 'Error renovando sesión',
        timestamp: new Date()
      });
      
      return false;
    }
  }

  /**
   * Fuerza el cierre de sesión
   */
  async forceSignOut(): Promise<void> {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      await supabase.auth.signOut();
      
      // Limpiar estado local
      this.currentSession = null;
      

    } catch (error) {
      console.error('Error cerrando sesión forzadamente:', error);
    }
  }

  /**
   * Obtiene la información de la sesión actual
   */
  getCurrentSession(): SessionInfo | null {
    return this.currentSession;
  }

  /**
   * Verifica si la sesión está activa
   */
  isSessionActive(): boolean {
    return this.currentSession?.status === SessionStatus.ACTIVE;
  }

  /**
   * Verifica si la sesión está por expirar
   */
  isSessionExpiringSoon(): boolean {
    return this.currentSession?.status === SessionStatus.EXPIRING_SOON;
  }

  /**
   * Verifica si la sesión ha expirado
   */
  isSessionExpired(): boolean {
    return this.currentSession?.status === SessionStatus.EXPIRED;
  }

  /**
   * Obtiene el tiempo restante de la sesión en minutos
   */
  getSessionTimeRemaining(): number {
    if (!this.currentSession) return 0;
    
    const now = new Date();
    const timeRemaining = this.currentSession.expiresAt.getTime() - now.getTime();
    
    return Math.max(0, Math.ceil(timeRemaining / 60000));
  }

  /**
   * Agrega un listener para eventos de sesión
   */
  addEventListener(eventType: string, callback: (event: SessionEvent) => void): void {
    this.eventListeners.set(eventType, callback);
  }

  /**
   * Remueve un listener de eventos
   */
  removeEventListener(eventType: string): void {
    this.eventListeners.delete(eventType);
  }

  /**
   * Emite un evento de sesión
   */
  private emitEvent(event: SessionEvent): void {
    const callback = this.eventListeners.get(event.type);
    if (callback) {
      callback(event);
    }
  }

  /**
   * Limpia recursos del gestor de sesiones
   */
  cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.eventListeners.clear();
    this.currentSession = null;
    this.isInitialized = false;
  }

  // =====================================================
  // MÉTODOS DE BASE DE DATOS
  // =====================================================

  /**
   * Registra una nueva sesión en la base de datos
   */
  private async recordSession(sessionInfo: SessionInfo): Promise<void> {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      await supabase
        .from('user_sessions')
        .insert({
          session_id: sessionInfo.id,
          user_id: sessionInfo.userId,
          email: sessionInfo.email,
          role: sessionInfo.role,
          created_at: sessionInfo.createdAt.toISOString(),
          expires_at: sessionInfo.expiresAt.toISOString(),
          last_activity: sessionInfo.lastActivity.toISOString(),
          status: sessionInfo.status,
          ip_address: '127.0.0.1', // En producción, obtener IP real
          user_agent: 'Unknown' // En producción, obtener User-Agent real
        });
    } catch (error) {
      console.error('Error registrando sesión:', error);
    }
  }

  /**
   * Actualiza la actividad de una sesión
   */
  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      await supabase
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString(),
          status: 'active'
        })
        .eq('session_id', sessionId);
    } catch (error) {
      console.error('Error actualizando actividad de sesión:', error);
    }
  }

  /**
   * Actualiza la información del usuario en una sesión
   */
  private async updateSessionUser(sessionId: string, user: any): Promise<void> {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      await supabase
        .from('user_sessions')
        .update({
          email: user.email,
          last_activity: new Date().toISOString()
        })
        .eq('session_id', sessionId);
    } catch (error) {
      console.error('Error actualizando usuario de sesión:', error);
    }
  }

  /**
   * Marca una sesión como terminada
   */
  private async terminateSession(sessionId: string): Promise<void> {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      await supabase
        .from('user_sessions')
        .update({
          status: 'terminated',
          terminated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
    } catch (error) {
      console.error('Error terminando sesión:', error);
    }
  }
}

// Instancia global
export const sessionManager = SessionManager.getInstance();

// Hook para usar en componentes React
export const useSessionManager = () => {
  return {
    sessionManager,
    getCurrentSession: () => sessionManager.getCurrentSession(),
    isSessionActive: () => sessionManager.isSessionActive(),
    isSessionExpiringSoon: () => sessionManager.isSessionExpiringSoon(),
    isSessionExpired: () => sessionManager.isSessionExpired(),
    getSessionTimeRemaining: () => sessionManager.getSessionTimeRemaining(),
    renewSession: () => sessionManager.renewSession(),
    forceSignOut: () => sessionManager.forceSignOut()
  };
};
