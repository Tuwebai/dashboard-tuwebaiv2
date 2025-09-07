import { useState, useCallback, useEffect } from 'react';
import { googleCalendarService, CalendarEvent } from '../lib/googleCalendarService';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
}

export const useGoogleCalendar = (currentUser?: User | null) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Usar el servicio de Google Calendar
  const service = googleCalendarService;
  const isConfigured = service.isConfigured();
  
  // Debug: Solo log si hay problemas de configuración
  if (!isConfigured) {
    console.warn('⚠️ Google Calendar no está configurado. Revisa las variables de entorno.');
  }

  // Inicializar servicio SOLO cuando se necesite (no automáticamente)
  const initializeService = useCallback(async () => {
    try {
      const initialized = await service.initialize();
      
      if (initialized) {
        // Verificar si ya hay una sesión activa
        const authenticated = service.isAuthenticated();
        
        if (authenticated) {
          // Verificar que realmente funcione obteniendo info del usuario
          try {
            const info = await service.getUserInfo();
            if (info) {
              setIsAuthenticated(true);
              setUserInfo(info);
            } else {
              setIsAuthenticated(false);
              setUserInfo(null);
            }
          } catch (error) {
            setIsAuthenticated(false);
            setUserInfo(null);
          }
        } else {
          // Intentar autenticación silenciosa automáticamente
          try {
            const silentAuthSuccess = await service.authenticateSilently();
            if (silentAuthSuccess) {
              setIsAuthenticated(true);
              const info = await service.getUserInfo();
              setUserInfo(info);
            }
          } catch (silentAuthError) {
            // Silencioso - no mostrar logs innecesarios
          }
        }
      }
    } catch (error) {
      console.warn('Error inicializando Google Calendar:', error);
    }
  }, [service]);

  // NO inicializar automáticamente - solo cuando se llame explícitamente

  // Función para verificar si hay tokens guardados
  const checkStoredTokens = () => {
    try {
      // Verificar si hay tokens de Google en localStorage
      const gsiStorage = localStorage.getItem('gsi');
      const googleTokens = localStorage.getItem('google_tokens');
      return !!(gsiStorage || googleTokens);
    } catch {
      return false;
    }
  };

  // Función para sincronizar el estado de autenticación
  const syncAuthenticationState = useCallback(async () => {
    try {
      const isReallyAuthenticated = service.isAuthenticated();
      if (isReallyAuthenticated !== isAuthenticated) {
        setIsAuthenticated(isReallyAuthenticated);
        if (isReallyAuthenticated) {
          const info = await service.getUserInfo();
          setUserInfo(info);
        } else {
          setUserInfo(null);
        }
      }
    } catch (error) {
      // Si hay error, asumir que no está autenticado
      if (isAuthenticated) {
        setIsAuthenticated(false);
        setUserInfo(null);
      }
    }
  }, [service, isAuthenticated]);

  // Sincronizar estado de autenticación periódicamente
  useEffect(() => {
    const interval = setInterval(syncAuthenticationState, 2000); // Cada 2 segundos
    return () => clearInterval(interval);
  }, [syncAuthenticationState]);

  // Autenticar usuario
  const authenticate = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await service.authenticate();
      setIsAuthenticated(success);
      
      if (success) {
        const info = await service.getUserInfo();
        setUserInfo(info);
        toast({
          title: "Conectado a Google Calendar",
          description: `Bienvenido, ${info?.name || 'Usuario'}`,
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error autenticando:', error);
      toast({
        title: "Error de autenticación",
        description: "No se pudo conectar con Google Calendar. Verifica la configuración.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  // Cerrar sesión
  const signOut = useCallback(async () => {
    try {
      await service.signOut();
      setIsAuthenticated(false);
      setUserInfo(null);
      setEvents([]);
      toast({
        title: "Sesión cerrada",
        description: "Te has desconectado de Google Calendar",
      });
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }, [service]);

  // Crear evento
  const createEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent | null> => {
    // Verificar autenticación real del servicio, no solo el estado local
    if (!service.isAuthenticated()) {
      throw new Error('No estás autenticado con Google Calendar');
    }

    setIsLoading(true);
    try {
      const createdEvent = await service.createEvent(event);
      
      if (createdEvent) {
        toast({
          title: "Evento creado",
          description: `"${event.summary}" ha sido agregado a tu calendario`,
        });
        
        // Actualizar lista de eventos
        const updatedEvents = await service.listEvents();
        setEvents(updatedEvents);
      }
      
      return createdEvent;
    } catch (error) {
      console.error('Error creando evento:', error);
      toast({
        title: "Error creando evento",
        description: "No se pudo crear el evento en Google Calendar",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  // Actualizar evento
  const updateEvent = useCallback(async (eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent | null> => {
    if (!service.isAuthenticated()) {
      throw new Error('No estás autenticado con Google Calendar');
    }

    setIsLoading(true);
    try {
      const updatedEvent = await service.updateEvent(eventId, event);
      
      if (updatedEvent) {
        toast({
          title: "Evento actualizado",
          description: `"${event.summary || 'Evento'}" ha sido actualizado`,
        });
        
        // Actualizar lista de eventos
        const updatedEvents = await service.listEvents();
        setEvents(updatedEvents);
      }
      
      return updatedEvent;
    } catch (error) {
      console.error('Error actualizando evento:', error);
      toast({
        title: "Error actualizando evento",
        description: "No se pudo actualizar el evento",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  // Eliminar evento
  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!service.isAuthenticated()) {
      throw new Error('No estás autenticado con Google Calendar');
    }

    setIsLoading(true);
    try {
      const success = await service.deleteEvent(eventId);
      
      if (success) {
        toast({
          title: "Evento eliminado",
          description: "El evento ha sido eliminado de tu calendario",
        });
        
        // Actualizar lista de eventos
        const updatedEvents = await service.listEvents();
        setEvents(updatedEvents);
      }
      
      return success;
    } catch (error) {
      console.error('Error eliminando evento:', error);
      toast({
        title: "Error eliminando evento",
        description: "No se pudo eliminar el evento",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  // Listar eventos
  const listEvents = useCallback(async (maxResults: number = 10): Promise<CalendarEvent[]> => {
    if (!service.isAuthenticated()) {
      throw new Error('No estás autenticado con Google Calendar');
    }

    setIsLoading(true);
    try {
      const eventsList = await service.listEvents(maxResults);
      setEvents(eventsList);
      return eventsList;
    } catch (error) {
      console.error('Error listando eventos:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  // Crear evento de reunión profesional y completo
  const createMeeting = useCallback(async (meetingData: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    attendees?: string[];
    location?: string;
    userMessage?: string; // Agregar mensaje del usuario para personalización
  }): Promise<CalendarEvent | null> => {
    // Generar descripción personalizada basada en el mensaje del usuario
    const generatePersonalizedDescription = (title: string, userMessage?: string): string => {
      // Si hay descripción personalizada, usarla
      if (meetingData.description) {
        return meetingData.description;
      }

      // Si hay mensaje del usuario, crear descripción basada en él
      if (userMessage) {
        const cleanMessage = userMessage.replace(/programar|reunir|reunión|meeting|calendario|calendar/gi, '').trim();
        
        return `📅 **${title}**

**Contexto:**
${cleanMessage}

**Agenda sugerida:**
• Revisión del tema principal
• Discusión de puntos clave
• Definición de próximos pasos
• Asignación de responsabilidades

**Preparación:**
• Revisar información relevante
• Preparar preguntas específicas
• Confirmar disponibilidad

**Objetivos:**
• Resolver dudas planteadas
• Establecer acuerdos claros
• Planificar acciones concretas

---
*Evento programado por Websy AI - TuWebAI Dashboard*
*Para más información: https://dashboard.tuweb-ai.com*`;
      }

      // Descripción genérica profesional
      return `📅 **${title}**

**Agenda:**
• Revisión de objetivos
• Análisis de situación actual
• Planificación de acciones
• Definición de responsabilidades

**Preparación requerida:**
• Revisar documentación relevante
• Preparar puntos de discusión
• Confirmar disponibilidad

**Objetivos:**
• Alinear expectativas
• Resolver dudas
• Establecer próximos pasos

---
*Evento programado por Websy AI - TuWebAI Dashboard*
*Para más información: https://dashboard.tuweb-ai.com*`;
    };

    // Generar ubicación profesional si no se proporciona
    const generateProfessionalLocation = (): string => {
      const locations = [
        'Google Meet - Enlace enviado por email',
        'Microsoft Teams - Sala virtual',
        'Zoom - Link compartido',
        'Sala de conferencias virtual'
      ];
      return locations[Math.floor(Math.random() * locations.length)];
    };

    // Solo usar asistentes reales si se proporcionan
    const getAttendees = (): string[] => {
      return meetingData.attendees || []; // No generar correos falsos
    };

    const personalizedDescription = generatePersonalizedDescription(meetingData.title, meetingData.userMessage);
    const professionalLocation = meetingData.location || generateProfessionalLocation();
    const attendees = getAttendees();

    const event: Omit<CalendarEvent, 'id'> = {
      summary: meetingData.title, // Quitar emoji para que se vea más profesional
      description: personalizedDescription,
      start: {
        dateTime: meetingData.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: meetingData.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      attendees: attendees.length > 0 ? attendees.map(email => ({ 
        email,
        responseStatus: 'needsAction',
        optional: false
      })) : [], // Solo incluir asistentes si existen
      location: professionalLocation,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 10 }
        ]
      }
    };

    return createEvent(event);
  }, [createEvent]);

  return {
    isAuthenticated,
    isLoading,
    userInfo,
    events,
    authenticate,
    signOut,
    createEvent,
    updateEvent,
    deleteEvent,
    listEvents,
    createMeeting,
    isConfigured,
    initializeService // Exponer función de inicialización manual
  };
};
