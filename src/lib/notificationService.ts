import { supabase } from './supabase';
import { handleSupabaseError, handleNetworkError } from './errorHandler';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'critical';
  category: 'system' | 'project' | 'ticket' | 'payment' | 'security' | 'user';
  is_read: boolean;
  is_urgent: boolean;
  action_url?: string;
  metadata?: any;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  project_updates: boolean;
  ticket_updates: boolean;
  payment_updates: boolean;
  security_alerts: boolean;
  system_notifications: boolean;
  daily_summary: boolean;
  weekly_report: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  title: string;
  message: string;
  type: Notification['type'];
  category: Notification['category'];
  is_urgent?: boolean;
  action_url?: string;
  metadata?: any;
  expires_at?: string;
}

export interface UpdateNotificationData {
  is_read?: boolean;
  is_urgent?: boolean;
  action_url?: string;
  metadata?: any;
  expires_at?: string;
}

export interface NotificationFilters {
  type?: string;
  category?: string;
  is_read?: boolean;
  is_urgent?: boolean;
  limit?: number;
  offset?: number;
  currentUserId?: string; // ID del usuario actual para filtrar notificaciones propias
}

class NotificationService {
  // Obtener notificaciones del usuario actual
  async getUserNotifications(filters: NotificationFilters = {}): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read);
      }
      if (filters.is_urgent !== undefined) {
        query = query.eq('is_urgent', filters.is_urgent);
      }

      // FILTRO CRÍTICO: Excluir notificaciones donde el sender_id sea igual al currentUserId
      // Nota: No podemos usar neq con metadata->sender_id en Supabase, lo filtramos después

      // Aplicar paginación
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        // No loggear el error aquí, se manejará en el catch
        throw error;
      }

      // Filtrar notificaciones adicionales en el cliente si es necesario
      let filteredData = data || [];
      
      if (filters.currentUserId && data) {
        filteredData = data.filter(notification => {
          const senderId = notification.metadata?.sender_id;
          const shouldExclude = senderId === filters.currentUserId;
          return !shouldExclude;
        });
      }

      return filteredData;
    } catch (error) {
      // Solo manejar errores de conexión, no loggear errores de red
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_CLOSED')) {
        // Error de conexión - no loggear, solo retornar array vacío
        return [];
      }
      handleSupabaseError(error, 'Obtener notificaciones');
      return [];
    }
  }

  // Obtener todas las notificaciones (solo admin)
  async getAllNotifications(filters: NotificationFilters = {}): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read);
      }
      if (filters.is_urgent !== undefined) {
        query = query.eq('is_urgent', filters.is_urgent);
      }

      // Aplicar paginación
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all notifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllNotifications:', error);
      throw error;
    }
  }

  // Crear nueva notificación
  async createNotification(notificationData: CreateNotificationData): Promise<Notification> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createNotification:', error);
      throw error;
    }
  }

  // Crear notificación para múltiples usuarios
  async createNotificationForUsers(userIds: string[], notificationData: Omit<CreateNotificationData, 'user_id'>): Promise<Notification[]> {
    try {
      const notifications = userIds.map(userId => ({
        ...notificationData,
        user_id: userId
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        console.error('Error creating notifications for users:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in createNotificationForUsers:', error);
      throw error;
    }
  }

  // Crear notificación para todos los usuarios
  async createNotificationForAllUsers(notificationData: Omit<CreateNotificationData, 'user_id'>): Promise<Notification[]> {
    try {
      // Obtener todos los IDs de usuarios
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      if (!users || users.length === 0) {
        return [];
      }

      const userIds = users.map(user => user.id);
      return await this.createNotificationForUsers(userIds, notificationData);
    } catch (error) {
      console.error('Error in createNotificationForAllUsers:', error);
      throw error;
    }
  }

  // Marcar notificación como leída
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
      throw error;
    }
  }

  // Marcar múltiples notificaciones como leídas
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds);

      if (error) {
        console.error('Error marking multiple notifications as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markMultipleAsRead:', error);
      throw error;
    }
  }

  // Marcar todas las notificaciones del usuario como leídas
  async markAllAsRead(): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      throw error;
    }
  }

  // Actualizar notificación
  async updateNotification(notificationId: string, updateData: UpdateNotificationData): Promise<Notification> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update(updateData)
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating notification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateNotification:', error);
      throw error;
    }
  }

  // Eliminar notificación
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      throw error;
    }
  }

  // Eliminar notificaciones expiradas
  async deleteExpiredNotifications(): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error deleting expired notifications:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteExpiredNotifications:', error);
      throw error;
    }
  }

  // Obtener configuración de notificaciones del usuario
  async getUserNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No hay configuración, crear una por defecto
          return await this.createDefaultNotificationSettings();
        }
        console.error('Error fetching notification settings:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserNotificationSettings:', error);
      throw error;
    }
  }

  // Crear configuración por defecto
  async createDefaultNotificationSettings(): Promise<NotificationSettings> {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .insert([{
          email_notifications: true,
          push_notifications: true,
          project_updates: true,
          ticket_updates: true,
          payment_updates: true,
          security_alerts: true,
          system_notifications: true,
          daily_summary: false,
          weekly_report: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating default notification settings:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createDefaultNotificationSettings:', error);
      throw error;
    }
  }

  // Actualizar configuración de notificaciones
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .update(settings)
        .select()
        .single();

      if (error) {
        console.error('Error updating notification settings:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateNotificationSettings:', error);
      throw error;
    }
  }

  // Obtener estadísticas de notificaciones
  async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    urgent: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*');

      if (error) {
        console.error('Error fetching notifications for stats:', error);
        throw error;
      }

      const total = notifications?.length || 0;
      const unread = notifications?.filter(n => !n.is_read).length || 0;
      const urgent = notifications?.filter(n => n.is_urgent).length || 0;

      const byType: Record<string, number> = {};
      const byCategory: Record<string, number> = {};

      notifications?.forEach(notification => {
        byType[notification.type] = (byType[notification.type] || 0) + 1;
        byCategory[notification.category] = (byCategory[notification.category] || 0) + 1;
      });

      return {
        total,
        unread,
        urgent,
        byType,
        byCategory
      };
    } catch (error) {
      console.error('Error in getNotificationStats:', error);
      throw error;
    }
  }

  // Crear notificaciones automáticas para eventos del sistema
  async createSystemNotification(
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    category: Notification['category'] = 'system',
    isUrgent: boolean = false
  ): Promise<void> {
    try {
      await this.createNotificationForAllUsers({
        title,
        message,
        type,
        category,
        is_urgent: isUrgent
      });
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw error;
    }
  }

  // Crear notificación de proyecto
  async createProjectNotification(
    userId: string,
    projectName: string,
    action: string,
    type: Notification['type'] = 'info'
  ): Promise<Notification> {
    const title = `Proyecto: ${projectName}`;
    const message = `El proyecto "${projectName}" ha sido ${action}`;
    
    return await this.createNotification({
      user_id: userId,
      title,
      message,
      type,
      category: 'project',
      action_url: `/admin/proyectos`
    });
  }

  // Crear notificación de ticket
  async createTicketNotification(
    userId: string,
    ticketTitle: string,
    action: string,
    type: Notification['type'] = 'info',
    isUrgent: boolean = false
  ): Promise<Notification> {
    const title = `Ticket: ${ticketTitle}`;
    const message = `El ticket "${ticketTitle}" ha sido ${action}`;
    
    return await this.createNotification({
      user_id: userId,
      title,
      message,
      type,
      category: 'ticket',
      is_urgent: isUrgent,
      action_url: `/admin#tickets`
    });
  }

  // Crear notificación de pago
  async createPaymentNotification(
    userId: string,
    amount: number,
    action: string,
    type: Notification['type'] = 'info'
  ): Promise<Notification> {
    const title = `Pago: $${amount}`;
    const message = `El pago de $${amount} ha sido ${action}`;
    
    return await this.createNotification({
      user_id: userId,
      title,
      message,
      type,
      category: 'payment',
      action_url: `/admin/pagos`
    });
  }

  // Crear notificación de seguridad
  async createSecurityNotification(
    userId: string,
    action: string,
    type: Notification['type'] = 'warning',
    isUrgent: boolean = true
  ): Promise<Notification> {
    const title = `Alerta de Seguridad`;
    const message = `Actividad de seguridad detectada: ${action}`;
    
    return await this.createNotification({
      user_id: userId,
      title,
      message,
      type,
      category: 'security',
      is_urgent: isUrgent,
      action_url: `/admin/security`
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
