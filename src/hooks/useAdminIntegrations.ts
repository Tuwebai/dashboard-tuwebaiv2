import { useState, useEffect, useCallback } from 'react';
import { useCalendarIntegration } from './useCalendarIntegration';
import { useEmailIntegration } from './useEmailIntegration';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

export const useAdminIntegrations = () => {
  const { user } = useApp();
  const calendar = useCalendarIntegration();
  const email = useEmailIntegration();
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeAdminIntegrations = useCallback(async () => {
    try {
      // Verificar si ya está autenticado, si no, intentar autenticar
      if (!calendar.isAuthenticated) {
        await calendar.authenticate();
      }

      setIsInitialized(true);
    } catch (error) {
      console.warn('Error inicializando integraciones:', error);
      setIsInitialized(true);
    }
  }, [calendar, email, user]);

  // NO auto-conectar servicios - solo cuando se llame explícitamente
  // useEffect(() => {
  //   if (user?.role === 'admin' && !isInitialized) {
  //     // Esperar un poco para que los hooks se inicialicen
  //     const timer = setTimeout(() => {
  //       initializeAdminIntegrations();
  //     }, 1000);
      
  //     return () => clearTimeout(timer);
  //   }
  // }, [user, isInitialized, initializeAdminIntegrations]);

  // Función para programar reunión automáticamente
  const scheduleMeeting = useCallback(async (title: string, date: Date, time: string, description?: string) => {
    if (!calendar.isAuthenticated) {
      await calendar.authenticate();
    }

    const startTime = new Date(`${date.toISOString().split('T')[0]}T${time}`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hora después

    const event = await calendar.createEvent({
      title,
      description: description || `Reunión programada por Websy AI`,
      start: startTime,
      end: endTime,
      location: 'Reunión virtual'
    });

    return event;
  }, [calendar]);

  // Función para enviar reporte automáticamente
  const sendReport = useCallback(async (recipients: string[], subject?: string, content?: string) => {
    if (!email.isAuthenticated) {
      await email.authenticate();
    }

    const reportData = {
      subject: subject || `Reporte de Websy AI - ${new Date().toLocaleDateString()}`,
      content: content || 'Reporte generado automáticamente por Websy AI'
    };

    const success = await email.sendReport(reportData, recipients);
    return success;
  }, [email]);

  return {
    calendar,
    email,
    isInitialized,
    scheduleMeeting,
    sendReport,
    isReady: calendar.isAuthenticated && email.isAuthenticated
  };
};
