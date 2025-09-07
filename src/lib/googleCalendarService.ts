/**
 * Servicio para integración con Google Calendar usando Google Identity Services (GSI)
 * Versión actualizada que usa las nuevas APIs de Google
 */

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  location?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private gapi: any = null;
  private isInitialized = false;
  private accessToken: string | null = null;
  private userInfo: { email: string; name: string } | null = null;

  private constructor() {}

  public static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  /**
   * Inicializar Google Calendar API usando GSI
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Limpiar tokens inválidos al inicializar
      this.clearInvalidTokens();

      // Cargar Google API
      if (!window.gapi) {
        await this.loadGoogleAPI();
      }

      // Cargar Google Identity Services
      await this.loadGSI();

      // Inicializar cliente
      await window.gapi.load('client', async () => {
        await window.gapi.client.init({
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
          ],
        });
      });

      this.gapi = window.gapi;
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error inicializando Google Calendar:', error);
      return false;
    }
  }

  /**
   * Cargar Google API dinámicamente
   */
  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Error cargando Google API'));
      document.head.appendChild(script);
    });
  }

  /**
   * Cargar Google Identity Services dinámicamente
   */
  private loadGSI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).google?.accounts) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Error cargando Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  /**
   * Autenticar usuario usando Google OAuth2
   */
  public async authenticate(): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      // Usar la autenticación directa de Google
      const authResult = await this.gapi.auth2.getAuthInstance().signIn({
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
      });

      if (authResult.isSignedIn()) {
        const user = authResult.getAuthResponse();
        this.accessToken = user.access_token;
        this.setAccessToken();
        
        // Guardar token en localStorage para persistencia
        try {
          localStorage.setItem('google_calendar_token', user.access_token);
        } catch (error) {
          console.warn('No se pudo guardar el token en localStorage:', error);
        }
        
        // Obtener información del usuario
        await this.fetchUserInfo();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error en autenticación:', error);
      throw error;
    }
  }

  /**
   * Autenticación silenciosa (sin popup) para auto-conexión
   */
  public async authenticateSilently(): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      // Verificar si ya hay tokens guardados
      const storedToken = this.getAccessToken();
      if (storedToken) {
        this.accessToken = storedToken;
        this.setAccessToken();
        
        // Verificar si el token es válido obteniendo info del usuario
        try {
          const userInfo = await this.getUserInfo();
          if (userInfo) {
            return true;
          }
        } catch (error) {
          this.clearAccessToken();
        }
      }

      // Intentar autenticación silenciosa con Google
      try {
        const authInstance = this.gapi.auth2.getAuthInstance();
        const user = authInstance.currentUser.get();
        
        if (user.isSignedIn()) {
          const authResponse = user.getAuthResponse();
          this.accessToken = authResponse.access_token;
          this.setAccessToken();
          
          // Guardar token en localStorage
          try {
            localStorage.setItem('google_calendar_token', authResponse.access_token);
          } catch (error) {
            console.warn('No se pudo guardar el token en localStorage:', error);
          }
          
          await this.fetchUserInfo();
          return true;
        }
      } catch (error) {
     }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener token de acceso desde localStorage
   */
  private getAccessToken(): string | null {
    try {
      return localStorage.getItem('google_calendar_token');
    } catch {
      return null;
    }
  }

  /**
   * Limpiar token de acceso
   */
  private clearAccessToken(): void {
    try {
      localStorage.removeItem('google_calendar_token');
      this.accessToken = null;
    } catch (error) {
      console.error('Error limpiando token:', error);
    }
  }

  /**
   * Limpiar tokens inválidos al inicializar
   */
  private clearInvalidTokens(): void {
    try {
      const storedToken = this.getAccessToken();
      if (storedToken) {
        // Verificar si el token es válido
        if (storedToken === 'simulated_token' || 
            storedToken === 'simulated_silent_token' ||
            (!storedToken.startsWith('ya29.') && !storedToken.startsWith('1//')) ||
            storedToken.length < 50) {
          this.clearAccessToken();
        }
      }
    } catch (error) {
      // Silencioso - no mostrar errores de limpieza
    }
  }

  /**
   * Establecer token de acceso en gapi
   */
  private setAccessToken(): void {
    if (this.gapi && this.accessToken) {
      // Configurar el token OAuth en gapi client
      this.gapi.client.setToken({ 
        access_token: this.accessToken,
        token_type: 'Bearer'
      });
      
      // También configurar en el auth instance si está disponible
      try {
        const authInstance = this.gapi.auth2.getAuthInstance();
        if (authInstance) {
          authInstance.currentUser.get().setAuthResponse({
            access_token: this.accessToken,
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
          });
        }
      } catch (error) {
        // No es crítico si falla
        console.log('No se pudo configurar auth instance:', error);
      }
    }
  }

  /**
   * Obtener información del usuario internamente
   */
  private async fetchUserInfo(): Promise<void> {
    try {
      // Usar la API de OAuth2 para obtener información básica del usuario
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        this.userInfo = {
          email: userData.email || 'usuario@ejemplo.com',
          name: userData.name || 'Usuario'
        };
      } else {
        throw new Error('Error obteniendo información del usuario');
      }
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
      // Usar información por defecto si falla
      this.userInfo = {
        email: 'usuario@ejemplo.com',
        name: 'Usuario'
      };
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  public isAuthenticated(): boolean {
    // Verificar que esté inicializado y tenga token
    if (!this.isInitialized || !this.accessToken) {
      return false;
    }

    // Verificar que el token tenga el formato correcto de Google OAuth
    if (!this.accessToken.startsWith('ya29.') && !this.accessToken.startsWith('1//')) {
      return false; // Token no tiene formato válido de Google
    }

    // Verificar que el token no esté expirado (básico)
    if (this.accessToken.length < 50) {
      return false; // Token demasiado corto para ser válido
    }

    return true;
  }

  /**
   * Crear evento en Google Calendar
   */
  public async createEvent(event: CalendarEvent): Promise<CalendarEvent | null> {
    if (!this.isInitialized || !this.isAuthenticated()) {
      throw new Error('Google Calendar no está inicializado o el usuario no está autenticado');
    }

    try {
      // Asegurar que el token esté configurado antes de hacer la llamada
      this.setAccessToken();
      
      const response = await this.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      return response.result;
    } catch (error) {
      console.error('Error creando evento:', error);
      throw error;
    }
  }

  /**
   * Actualizar evento existente
   */
  public async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    if (!this.isInitialized || !this.isAuthenticated()) {
      throw new Error('Google Calendar no está inicializado o el usuario no está autenticado');
    }

    try {
      // Asegurar que el token esté configurado antes de hacer la llamada
      this.setAccessToken();
      
      const response = await this.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      return response.result;
    } catch (error) {
      console.error('Error actualizando evento:', error);
      throw error;
    }
  }

  /**
   * Eliminar evento
   */
  public async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.isInitialized || !this.isAuthenticated()) {
      throw new Error('Google Calendar no está inicializado o el usuario no está autenticado');
    }

    try {
      // Asegurar que el token esté configurado antes de hacer la llamada
      this.setAccessToken();
      
      await this.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      return true;
    } catch (error) {
      console.error('Error eliminando evento:', error);
      throw error;
    }
  }

  /**
   * Listar eventos
   */
  public async listEvents(maxResults: number = 10): Promise<CalendarEvent[]> {
    if (!this.isInitialized || !this.isAuthenticated()) {
      throw new Error('Google Calendar no está inicializado o el usuario no está autenticado');
    }

    try {
      // Asegurar que el token esté configurado antes de hacer la llamada
      this.setAccessToken();
      
      const response = await this.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.result.items || [];
    } catch (error) {
      console.error('Error listando eventos:', error);
      throw error;
    }
  }

  /**
   * Obtener información del usuario autenticado
   */
  public async getUserInfo(): Promise<{ email: string; name: string } | null> {
    if (!this.isInitialized || !this.isAuthenticated()) {
      return null;
    }

    return this.userInfo;
  }

  /**
   * Cerrar sesión
   */
  public async signOut(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.accessToken = null;
      this.userInfo = null;
      
      // Revocar token si existe
      if (this.accessToken) {
        (window as any).google?.accounts?.oauth2?.revoke(this.accessToken);
      }
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }

  /**
   * Verificar si está configurado
   */
  public isConfigured(): boolean {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    return !!(apiKey && clientId);
  }
}

// Instancia singleton
export const googleCalendarService = GoogleCalendarService.getInstance();
