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

class ActivityNotificationService {
  private readonly STORAGE_KEY = 'activity_notifications';
  private readonly PREFERENCES_KEY = 'notification_preferences';
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: ((notifications: ActivityEvent[]) => void)[] = [];

  constructor() {
    this.loadPreferences();
  }

  /**
   * Inicia el monitoreo de actividad
   */
  startMonitoring(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.checkForNewActivity();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Detiene el monitoreo de actividad
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Suscribe un callback para recibir notificaciones
   */
  subscribe(callback: (notifications: ActivityEvent[]) => void): () => void {
    this.callbacks.push(callback);
    
    // Devolver función para desuscribirse
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Verifica si hay nueva actividad
   */
  private async checkForNewActivity(): Promise<void> {
    try {
      const preferences = this.getPreferences();
      if (!preferences.general.enabled) return;

      const notifications: ActivityEvent[] = [];

      // Verificar GitHub si está conectado
      if (preferences.github) {
        const githubNotifications = await this.checkGitHubActivity();
        notifications.push(...githubNotifications);
      }

      // Verificar LinkedIn si está conectado
      if (preferences.linkedin) {
        const linkedinNotifications = await this.checkLinkedInActivity();
        notifications.push(...linkedinNotifications);
      }

      if (notifications.length > 0) {
        this.saveNotifications(notifications);
        this.notifySubscribers(notifications);
      }
    } catch (error) {
      console.error('Error checking activity:', error);
    }
  }

  /**
   * Verifica actividad de GitHub
   */
  private async checkGitHubActivity(): Promise<ActivityEvent[]> {
    // Simulación de verificación de actividad
    // En una implementación real, harías llamadas a la API de GitHub
    const notifications: ActivityEvent[] = [];
    
    // Simular eventos aleatorios
    if (Math.random() < 0.1) { // 10% de probabilidad
      notifications.push({
        id: `github-${Date.now()}`,
        type: 'github',
        event: 'new_star',
        data: {
          repository: 'mi-proyecto-awesome',
          stars: Math.floor(Math.random() * 10) + 1
        },
        timestamp: Date.now(),
        read: false
      });
    }

    if (Math.random() < 0.05) { // 5% de probabilidad
      notifications.push({
        id: `github-${Date.now()}-fork`,
        type: 'github',
        event: 'new_fork',
        data: {
          repository: 'mi-proyecto-awesome',
          forker: 'usuario-forker'
        },
        timestamp: Date.now(),
        read: false
      });
    }

    return notifications;
  }

  /**
   * Verifica actividad de LinkedIn
   */
  private async checkLinkedInActivity(): Promise<ActivityEvent[]> {
    // Simulación de verificación de actividad
    const notifications: ActivityEvent[] = [];
    
    if (Math.random() < 0.08) { // 8% de probabilidad
      notifications.push({
        id: `linkedin-${Date.now()}`,
        type: 'linkedin',
        event: 'new_connection',
        data: {
          name: 'Nuevo Contacto',
          position: 'Desarrollador Senior'
        },
        timestamp: Date.now(),
        read: false
      });
    }

    return notifications;
  }

  /**
   * Obtiene todas las notificaciones
   */
  getNotifications(): ActivityEvent[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Guarda notificaciones
   */
  private saveNotifications(notifications: ActivityEvent[]): void {
    const existing = this.getNotifications();
    const all = [...existing, ...notifications];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
  }

  /**
   * Marca notificaciones como leídas
   */
  markAsRead(notificationIds: string[]): void {
    const notifications = this.getNotifications();
    const updated = notifications.map(notification => 
      notificationIds.includes(notification.id) 
        ? { ...notification, read: true }
        : notification
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * Elimina notificaciones
   */
  deleteNotifications(notificationIds: string[]): void {
    const notifications = this.getNotifications();
    const filtered = notifications.filter(notification => 
      !notificationIds.includes(notification.id)
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * Obtiene preferencias de notificación
   */
  getPreferences(): NotificationPreferences {
    const stored = localStorage.getItem(this.PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    // Preferencias por defecto
    return {
      github: {
        newFollower: true,
        newStar: true,
        newFork: true,
        newCommit: false,
        weeklySummary: true
      },
      linkedin: {
        newConnection: true,
        newPost: false,
        profileView: false,
        weeklySummary: true
      },
      general: {
        enabled: true,
        sound: true,
        email: false
      }
    };
  }

  /**
   * Guarda preferencias de notificación
   */
  savePreferences(preferences: NotificationPreferences): void {
    localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
  }

  /**
   * Notifica a los suscriptores
   */
  private notifySubscribers(notifications: ActivityEvent[]): void {
    this.callbacks.forEach(callback => {
      try {
        callback(notifications);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  /**
   * Carga preferencias por defecto
   */
  private loadPreferences(): void {
    const preferences = this.getPreferences();
    this.savePreferences(preferences);
  }

  /**
   * Obtiene estadísticas de notificaciones
   */
  getNotificationStats(): {
    total: number;
    unread: number;
    byType: { [key: string]: number };
  } {
    const notifications = this.getNotifications();
    const unread = notifications.filter(n => !n.read).length;
    
    const byType = notifications.reduce((acc, notification) => {
      const key = `${notification.type}_${notification.event}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      total: notifications.length,
      unread,
      byType
    };
  }
}

export const activityNotificationService = new ActivityNotificationService();
export default activityNotificationService;
