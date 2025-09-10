import { useState, useEffect, useCallback } from 'react';
import { activityNotificationService } from '@/services/activityNotificationService';
import { toast } from '@/hooks/use-toast';

interface ActivityEvent {
  id: string;
  type: 'github' | 'linkedin';
  event: string;
  data: any;
  timestamp: number;
  read: boolean;
}

interface NotificationPreferences {
  github: {
    newFollower: boolean;
    newStar: boolean;
    newFork: boolean;
    newCommit: boolean;
    weeklySummary: boolean;
  };
  linkedin: {
    newConnection: boolean;
    newPost: boolean;
    profileView: boolean;
    weeklySummary: boolean;
  };
  general: {
    enabled: boolean;
    sound: boolean;
    email: boolean;
  };
}

export const useActivityNotifications = () => {
  const [notifications, setNotifications] = useState<ActivityEvent[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    activityNotificationService.getPreferences()
  );
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Cargar notificaciones al montar
  useEffect(() => {
    setNotifications(activityNotificationService.getNotifications());
  }, []);

  // Suscribirse a nuevas notificaciones
  useEffect(() => {
    const unsubscribe = activityNotificationService.subscribe((newNotifications) => {
      setNotifications(prev => [...prev, ...newNotifications]);
      
      // Mostrar toast para cada notificación
      newNotifications.forEach(notification => {
        const message = getNotificationMessage(notification);
        if (message) {
          toast({
            title: message.title,
            description: message.description,
            duration: 5000,
          });
        }
      });
    });

    return unsubscribe;
  }, []);

  // Iniciar/detener monitoreo basado en preferencias
  useEffect(() => {
    if (preferences.general.enabled && !isMonitoring) {
      activityNotificationService.startMonitoring();
      setIsMonitoring(true);
    } else if (!preferences.general.enabled && isMonitoring) {
      activityNotificationService.stopMonitoring();
      setIsMonitoring(false);
    }
  }, [preferences.general.enabled, isMonitoring]);

  // Obtener mensaje de notificación
  const getNotificationMessage = (notification: ActivityEvent) => {
    switch (notification.event) {
      case 'new_star':
        return {
          title: '⭐ Nueva estrella',
          description: `Tu repositorio "${notification.data.repository}" recibió ${notification.data.stars} estrellas`
        };
      case 'new_fork':
        return {
          title: '🍴 Nuevo fork',
          description: `Tu repositorio "${notification.data.repository}" fue forkeado por ${notification.data.forker}`
        };
      case 'new_connection':
        return {
          title: '🤝 Nueva conexión',
          description: `Nueva conexión: ${notification.data.name} - ${notification.data.position}`
        };
      case 'new_follower':
        return {
          title: '👥 Nuevo seguidor',
          description: `Tienes un nuevo seguidor en GitHub`
        };
      default:
        return null;
    }
  };

  // Marcar como leído
  const markAsRead = useCallback((notificationIds: string[]) => {
    activityNotificationService.markAsRead(notificationIds);
    setNotifications(prev => 
      prev.map(notification => 
        notificationIds.includes(notification.id) 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Eliminar notificaciones
  const deleteNotifications = useCallback((notificationIds: string[]) => {
    activityNotificationService.deleteNotifications(notificationIds);
    setNotifications(prev => 
      prev.filter(notification => !notificationIds.includes(notification.id))
    );
  }, []);

  // Actualizar preferencias
  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    activityNotificationService.savePreferences(updated);
    setPreferences(updated);
  }, [preferences]);

  // Obtener estadísticas
  const getStats = useCallback(() => {
    return activityNotificationService.getNotificationStats();
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    const unreadIds = notifications
      .filter(n => !n.read)
      .map(n => n.id);
    
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  }, [notifications, markAsRead]);

  // Eliminar todas las notificaciones
  const clearAll = useCallback(() => {
    const allIds = notifications.map(n => n.id);
    deleteNotifications(allIds);
  }, [notifications, deleteNotifications]);

  // Obtener notificaciones no leídas
  const unreadNotifications = notifications.filter(n => !n.read);

  // Obtener notificaciones por tipo
  const getNotificationsByType = useCallback((type: 'github' | 'linkedin') => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  return {
    notifications,
    unreadNotifications,
    preferences,
    isMonitoring,
    markAsRead,
    deleteNotifications,
    updatePreferences,
    getStats,
    markAllAsRead,
    clearAll,
    getNotificationsByType,
    getNotificationMessage
  };
};
