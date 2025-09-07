import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { validateGoogleConfig, generateAuthUrl, GOOGLE_CONFIG } from '@/lib/googleConfig';

interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: string[];
  location?: string;
  reminders?: number[];
}

interface CalendarIntegration {
  isAuthenticated: boolean;
  isLoading: boolean;
  events: CalendarEvent[];
  authenticate: () => Promise<void>;
  createEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent | null>;
  updateEvent: (eventId: string, event: Partial<CalendarEvent>) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  listEvents: (timeMin?: Date, timeMax?: Date) => Promise<CalendarEvent[]>;
  searchEvents: (query: string) => Promise<CalendarEvent[]>;
  setIsAuthenticated?: (value: boolean) => void;
}

export const useCalendarIntegration = (): CalendarIntegration => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Listener para capturar el token de Google OAuth
  useEffect(() => {
    const handleAuthCallback = () => {
      const hash = window.location.hash;
      if (hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        if (accessToken) {
          localStorage.setItem('google_calendar_token', accessToken);
          setIsAuthenticated(true);
          toast({
            title: "Calendario conectado",
            description: "Se ha conectado exitosamente con Google Calendar."
          });
          // Limpiar la URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    // Verificar si ya hay un token al cargar
    const existingToken = localStorage.getItem('google_calendar_token');
    if (existingToken) {
      setIsAuthenticated(true);
    }

    // Escuchar cambios en el hash
    window.addEventListener('hashchange', handleAuthCallback);
    handleAuthCallback(); // Verificar inmediatamente

    return () => {
      window.removeEventListener('hashchange', handleAuthCallback);
    };
  }, []);

  // Autenticación con Google Calendar
  const authenticate = useCallback(async () => {
    setIsLoading(true);
    try {
      // Verificar si ya está autenticado
      const token = localStorage.getItem('google_calendar_token');
      if (token) {
        setIsAuthenticated(true);
        return;
      }

      // Verificar configuración
      if (!validateGoogleConfig()) {
        throw new Error('Google Client ID no configurado. Verifica tu archivo .env');
      }

      // Crear popup de autenticación con URL correcta
      const authUrl = generateAuthUrl(GOOGLE_CONFIG.scopes.calendar);
      
      const popup = window.open(authUrl, 'google-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      if (!popup) {
        throw new Error('No se pudo abrir la ventana de autenticación. Verifica que los popups estén permitidos.');
      }

    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: "No se pudo conectar con Google Calendar.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Crear evento
  const createEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent | null> => {
    if (!isAuthenticated) {
      await authenticate();
      if (!isAuthenticated) return null;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('google_calendar_token');
      if (!token || token.startsWith('admin_token_')) {
        // Si es un token simulado, simular creación exitosa
        const mockEvent: CalendarEvent = {
          ...event,
          id: `mock_${Date.now()}`
        };
        setEvents(prev => [...prev, mockEvent]);
        return mockEvent;
      }

      const eventData = {
        summary: event.title,
        description: event.description || '',
        start: {
          dateTime: event.start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: event.attendees?.map(email => ({ email })),
        location: event.location || '',
        reminders: {
          useDefault: false,
          overrides: event.reminders?.map(minutes => ({
            method: 'popup',
            minutes
          })) || [{ method: 'popup', minutes: 10 }]
        }
      };

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error(`Error creando evento: ${response.statusText}`);
      }

      const createdEvent = await response.json();
      const newEvent: CalendarEvent = {
        id: createdEvent.id,
        title: createdEvent.summary,
        description: createdEvent.description,
        start: new Date(createdEvent.start.dateTime),
        end: new Date(createdEvent.end.dateTime),
        attendees: createdEvent.attendees?.map((a: any) => a.email),
        location: createdEvent.location
      };

      setEvents(prev => [...prev, newEvent]);
      
      toast({
        title: "Evento creado",
        description: `"${event.title}" se ha programado exitosamente.`
      });

      return newEvent;
    } catch (error) {
      toast({
        title: "Error creando evento",
        description: "No se pudo crear el evento en el calendario.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authenticate]);

  // Actualizar evento
  const updateEvent = useCallback(async (eventId: string, event: Partial<CalendarEvent>): Promise<boolean> => {
    if (!isAuthenticated) return false;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('google_calendar_token');
      if (!token) throw new Error('No hay token de autenticación');

      const eventData: any = {};
      if (event.title) eventData.summary = event.title;
      if (event.description) eventData.description = event.description;
      if (event.start) eventData.start = { dateTime: event.start.toISOString() };
      if (event.end) eventData.end = { dateTime: event.end.toISOString() };
      if (event.attendees) eventData.attendees = event.attendees.map(email => ({ email }));
      if (event.location) eventData.location = event.location;

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error(`Error actualizando evento: ${response.statusText}`);
      }

      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...event } : e));
      
      toast({
        title: "Evento actualizado",
        description: "El evento se ha actualizado correctamente."
      });

      return true;
    } catch (error) {
      toast({
        title: "Error actualizando evento",
        description: "No se pudo actualizar el evento.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Eliminar evento
  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('google_calendar_token');
      if (!token) throw new Error('No hay token de autenticación');

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error eliminando evento: ${response.statusText}`);
      }

      setEvents(prev => prev.filter(e => e.id !== eventId));
      
      toast({
        title: "Evento eliminado",
        description: "El evento se ha eliminado correctamente."
      });

      return true;
    } catch (error) {
      toast({
        title: "Error eliminando evento",
        description: "No se pudo eliminar el evento.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Listar eventos
  const listEvents = useCallback(async (timeMin?: Date, timeMax?: Date): Promise<CalendarEvent[]> => {
    if (!isAuthenticated) return [];

    setIsLoading(true);
    try {
      const token = localStorage.getItem('google_calendar_token');
      if (!token || token.startsWith('admin_token_')) {
        // Si es un token simulado, no hacer llamada real
        return [];
      }

      const params = new URLSearchParams({
        timeMin: (timeMin || new Date()).toISOString(),
        timeMax: (timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime'
      });

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error listando eventos: ${response.statusText}`);
      }

      const data = await response.json();
      const calendarEvents: CalendarEvent[] = data.items?.map((item: any) => ({
        id: item.id,
        title: item.summary,
        description: item.description,
        start: new Date(item.start.dateTime || item.start.date),
        end: new Date(item.end.dateTime || item.end.date),
        attendees: item.attendees?.map((a: any) => a.email),
        location: item.location
      })) || [];

      setEvents(calendarEvents);
      return calendarEvents;
    } catch (error) {
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Buscar eventos
  const searchEvents = useCallback(async (query: string): Promise<CalendarEvent[]> => {
    if (!isAuthenticated) return [];

    setIsLoading(true);
    try {
      const token = localStorage.getItem('google_calendar_token');
      if (!token) throw new Error('No hay token de autenticación');

      const params = new URLSearchParams({
        q: query,
        timeMin: new Date().toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime'
      });

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error buscando eventos: ${response.statusText}`);
      }

      const data = await response.json();
      const calendarEvents: CalendarEvent[] = data.items?.map((item: any) => ({
        id: item.id,
        title: item.summary,
        description: item.description,
        start: new Date(item.start.dateTime || item.start.date),
        end: new Date(item.end.dateTime || item.end.date),
        attendees: item.attendees?.map((a: any) => a.email),
        location: item.location
      })) || [];

      return calendarEvents;
    } catch (error) {
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    isLoading,
    events,
    authenticate,
    createEvent,
    updateEvent,
    deleteEvent,
    listEvents,
    searchEvents,
    setIsAuthenticated
  };
};
