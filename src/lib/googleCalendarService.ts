// Servicio simple de Google Calendar para el navegador
// Usa Google Identity Services en lugar de googleapis

export interface CalendarEvent {
  id: string;
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
    responseStatus?: string;
    optional?: boolean;
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

class GoogleCalendarService {
  private isAuthenticatedFlag = false;
  private userInfo: { email: string; name: string } | null = null;

  constructor() {
    this.initializeGoogleAPI();
  }

  private async initializeGoogleAPI() {
    try {
      // Cargar Google Identity Services
      if (typeof window !== 'undefined' && !window.google) {
        await this.loadGoogleScript();
      }
    } catch (error) {
      console.warn('Error initializing Google API:', error);
    }
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google script'));
      document.head.appendChild(script);
    });
  }

  isConfigured(): boolean {
    return !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedFlag;
  }

  async initialize(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.warn('Google Calendar not configured');
        return false;
      }

      await this.initializeGoogleAPI();
      return true;
    } catch (error) {
      console.error('Error initializing Google Calendar:', error);
      return false;
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Google Calendar not configured');
      }

      // Usar Google Identity Services para autenticación
      return new Promise((resolve) => {
        if (window.google) {
          window.google.accounts.oauth2.initTokenClient({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
            callback: async (response: any) => {
              if (response.access_token) {
                this.isAuthenticatedFlag = true;
                
                // Guardar token para autenticación silenciosa
                localStorage.setItem('google_calendar_token', response.access_token);
                
                // Obtener información real del usuario
                try {
                  const userInfo = await this.fetchUserInfo(response.access_token);
                  this.userInfo = userInfo;
                } catch (error) {
                  console.error('Error fetching user info:', error);
                  // Fallback a información básica
                  this.userInfo = {
                    email: 'usuario@google.com',
                    name: 'Usuario Google'
                  };
                }
                
                resolve(true);
              } else {
                resolve(false);
              }
            }
          }).requestAccessToken();
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Error authenticating:', error);
      return false;
    }
  }

  private async fetchUserInfo(accessToken: string): Promise<{ email: string; name: string }> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userData = await response.json();
      return {
        email: userData.email || 'usuario@google.com',
        name: userData.name || 'Usuario Google'
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  async authenticateSilently(): Promise<boolean> {
    try {
      // Verificar si ya hay un token guardado en localStorage
      const savedToken = localStorage.getItem('google_calendar_token');
      if (savedToken) {
        try {
          // Verificar si el token sigue siendo válido
          const userInfo = await this.fetchUserInfo(savedToken);
          this.isAuthenticatedFlag = true;
          this.userInfo = userInfo;
          return true;
        } catch (error) {
          // Token expirado, limpiar
          localStorage.removeItem('google_calendar_token');
          this.isAuthenticatedFlag = false;
          this.userInfo = null;
        }
      }
      return false;
    } catch (error) {
      console.error('Error in silent authentication:', error);
      return false;
    }
  }

  async getUserInfo(): Promise<{ email: string; name: string } | null> {
    return this.userInfo;
  }

  async signOut(): Promise<void> {
    this.isAuthenticatedFlag = false;
    this.userInfo = null;
    // Limpiar token guardado
    localStorage.removeItem('google_calendar_token');
  }

  async createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent | null> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const token = localStorage.getItem('google_calendar_token');
      if (!token) {
        throw new Error('No access token available');
      }

      // Crear evento real en Google Calendar
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
          location: event.location,
          reminders: event.reminders,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create event: ${errorData.error?.message || response.statusText}`);
      }

      const createdEvent = await response.json();
      
      return {
        id: createdEvent.id,
        summary: createdEvent.summary,
        description: createdEvent.description,
        start: createdEvent.start,
        end: createdEvent.end,
        attendees: createdEvent.attendees,
        location: createdEvent.location,
        reminders: createdEvent.reminders,
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const token = localStorage.getItem('google_calendar_token');
      if (!token) {
        throw new Error('No access token available');
      }

      // Actualizar evento real en Google Calendar
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
          location: event.location,
          reminders: event.reminders,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update event: ${errorData.error?.message || response.statusText}`);
      }

      const updatedEvent = await response.json();
      
      return {
        id: updatedEvent.id,
        summary: updatedEvent.summary,
        description: updatedEvent.description,
        start: updatedEvent.start,
        end: updatedEvent.end,
        attendees: updatedEvent.attendees,
        location: updatedEvent.location,
        reminders: updatedEvent.reminders,
      };
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const token = localStorage.getItem('google_calendar_token');
      if (!token) {
        throw new Error('No access token available');
      }

      // Eliminar evento real de Google Calendar
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete event: ${errorData.error?.message || response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  async listEvents(maxResults: number = 10): Promise<CalendarEvent[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const token = localStorage.getItem('google_calendar_token');
      if (!token) {
        throw new Error('No access token available');
      }

      // Obtener eventos reales de Google Calendar
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Próximos 30 días

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${timeMin}&timeMax=${timeMax}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to list events: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const events: CalendarEvent[] = (data.items || []).map((event: any) => ({
        id: event.id,
        summary: event.summary || 'Sin título',
        description: event.description,
        start: event.start,
        end: event.end,
        attendees: event.attendees,
        location: event.location,
        reminders: event.reminders,
      }));

      return events;
    } catch (error) {
      console.error('Error listing calendar events:', error);
      throw error;
    }
  }
}

// Instancia singleton
export const googleCalendarService = new GoogleCalendarService();
