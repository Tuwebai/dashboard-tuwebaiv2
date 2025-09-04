import { supabase } from './supabase';
import { notificationService } from './notificationService';
import { notificationTemplateService } from './notificationTemplateService';
import { notificationChannelService } from './notificationChannelService';

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

export interface ScheduledNotification {
  id: string;
  userId: string;
  templateId?: string;
  ruleId?: string;
  channels: string[];
  subject?: string;
  content: string;
  htmlContent?: string;
  variables: Record<string, any>;
  scheduledFor: string;
  status: 'pending' | 'ready' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleNotificationRequest {
  userId: string;
  templateId?: string;
  ruleId?: string;
  channels: string[];
  subject?: string;
  content: string;
  htmlContent?: string;
  variables?: Record<string, any>;
  scheduledFor: string;
  maxAttempts?: number;
}

export interface NotificationSchedule {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  channels: string[];
  schedule: {
    type: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
    cronExpression?: string;
    timezone: string;
    startDate: string;
    endDate?: string;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SmartScheduleOptions {
  userId: string;
  templateId: string;
  channels: string[];
  variables?: Record<string, any>;
  preferences?: {
    timezone: string;
    quietHours: {
      start: string; // HH:mm
      end: string;   // HH:mm
      days: number[]; // 0-6 (domingo-sábado)
    };
    businessHours: {
      start: string; // HH:mm
      end: string;   // HH:mm
      days: number[]; // 0-6 (domingo-sábado)
    };
    maxNotificationsPerDay: number;
    preferredChannels: string[];
  };
}

// =====================================================
// SERVICIO DE NOTIFICACIONES PROGRAMADAS
// =====================================================

export class ScheduledNotificationService {
  private static instance: ScheduledNotificationService;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startProcessing();
  }

  public static getInstance(): ScheduledNotificationService {
    if (!ScheduledNotificationService.instance) {
      ScheduledNotificationService.instance = new ScheduledNotificationService();
    }
    return ScheduledNotificationService.instance;
  }

  // =====================================================
  // MÉTODOS PRINCIPALES
  // =====================================================

  /**
   * Programar una notificación para envío futuro
   */
  async scheduleNotification(request: ScheduleNotificationRequest): Promise<ScheduledNotification> {
    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .insert({
          user_id: request.userId,
          template_id: request.templateId,
          rule_id: request.ruleId,
          channels: request.channels,
          subject: request.subject,
          content: request.content,
          html_content: request.htmlContent,
          variables: request.variables || {},
          scheduled_for: request.scheduledFor,
          max_attempts: request.maxAttempts || 3,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapToScheduledNotification(data);
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Programar notificación usando plantilla
   */
  async scheduleWithTemplate(
    userId: string,
    templateId: string,
    variables: Record<string, any>,
    scheduledFor: string,
    channels?: string[]
  ): Promise<ScheduledNotification> {
    try {
      const template = await notificationTemplateService.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      const rendered = await notificationTemplateService.renderTemplate(templateId, variables);
      
      return await this.scheduleNotification({
        userId,
        templateId,
        channels: channels || template.channels,
        subject: rendered.subject,
        content: rendered.content,
        htmlContent: rendered.htmlContent,
        variables,
        scheduledFor
      });
    } catch (error) {
      console.error('Error scheduling notification with template:', error);
      throw error;
    }
  }

  /**
   * Programación inteligente basada en preferencias del usuario
   */
  async smartSchedule(options: SmartScheduleOptions): Promise<ScheduledNotification> {
    try {
      const { userId, templateId, variables, preferences } = options;
      
      // Calcular el mejor momento para enviar
      const bestTime = this.calculateBestSendTime(preferences);
      
      // Aplicar filtros de canales según preferencias
      const template = await notificationTemplateService.getTemplate(templateId);
      const availableChannels = this.filterChannelsByPreferences(
        template?.channels || options.channels,
        preferences
      );

      return await this.scheduleWithTemplate(
        userId,
        templateId,
        variables || {},
        bestTime,
        availableChannels
      );
    } catch (error) {
      console.error('Error in smart schedule:', error);
      throw error;
    }
  }

  /**
   * Obtener notificaciones programadas de un usuario
   */
  async getUserScheduledNotifications(userId: string): Promise<ScheduledNotification[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;

      return data.map(this.mapToScheduledNotification);
    } catch (error) {
      console.error('Error getting user scheduled notifications:', error);
      throw error;
    }
  }

  /**
   * Cancelar notificación programada
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .update({ status: 'cancelled' })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling scheduled notification:', error);
      throw error;
    }
  }

  /**
   * Reprogramar notificación
   */
  async rescheduleNotification(
    notificationId: string,
    newScheduledFor: string
  ): Promise<ScheduledNotification> {
    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .update({
          scheduled_for: newScheduledFor,
          status: 'pending',
          attempts: 0,
          error_message: null
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;

      return this.mapToScheduledNotification(data);
    } catch (error) {
      console.error('Error rescheduling notification:', error);
      throw error;
    }
  }

  // =====================================================
  // PROCESAMIENTO AUTOMÁTICO
  // =====================================================

  /**
   * Iniciar procesamiento automático de notificaciones programadas
   */
  private startProcessing(): void {
    // Procesar cada minuto
    this.processingInterval = setInterval(() => {
      this.processScheduledNotifications().catch(error => {
        console.error('Error processing scheduled notifications:', error);
      });
    }, 60000); // 1 minuto
  }

  /**
   * Detener procesamiento automático
   */
  public stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Procesar notificaciones programadas listas para enviar
   */
  async processScheduledNotifications(): Promise<void> {
    try {
      // Obtener notificaciones listas para enviar
      const { data: readyNotifications, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .limit(50); // Procesar máximo 50 a la vez

      if (error) throw error;

      if (!readyNotifications || readyNotifications.length === 0) {
        return;
      }

      // Procesar cada notificación
      for (const notification of readyNotifications) {
        await this.processNotification(notification);
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }

  /**
   * Procesar una notificación individual
   */
  private async processNotification(notification: any): Promise<void> {
    try {
      // Actualizar estado a "enviando"
      await supabase
        .from('scheduled_notifications')
        .update({
          status: 'ready',
          last_attempt_at: new Date().toISOString(),
          attempts: notification.attempts + 1
        })
        .eq('id', notification.id);

      // Enviar notificación
      const result = await notificationService.createNotification({
        userId: notification.user_id,
        title: notification.subject || 'Notificación',
        message: notification.content,
        category: 'scheduled',
        priority: 'normal',
        channels: notification.channels,
        data: notification.variables
      });

      if (result) {
        // Marcar como enviada
        await supabase
          .from('scheduled_notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', notification.id);
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      console.error(`Error processing notification ${notification.id}:`, error);
      
      // Marcar como fallida si se agotaron los intentos
      const newAttempts = notification.attempts + 1;
      const status = newAttempts >= notification.max_attempts ? 'failed' : 'pending';
      
      await supabase
        .from('scheduled_notifications')
        .update({
          status,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          attempts: newAttempts
        })
        .eq('id', notification.id);
    }
  }

  // =====================================================
  // MÉTODOS DE UTILIDAD
  // =====================================================

  /**
   * Calcular el mejor momento para enviar basado en preferencias
   */
  private calculateBestSendTime(preferences?: SmartScheduleOptions['preferences']): string {
    if (!preferences) {
      // Enviar en 1 hora por defecto
      return new Date(Date.now() + 60 * 60 * 1000).toISOString();
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Verificar si estamos en horario de trabajo
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const businessStart = this.timeToMinutes(preferences.businessHours.start);
    const businessEnd = this.timeToMinutes(preferences.businessHours.end);
    
    if (currentTime >= businessStart && currentTime <= businessEnd) {
      // Estamos en horario de trabajo, enviar en 30 minutos
      return new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    } else {
      // Estamos fuera de horario, enviar al inicio del próximo día laboral
      const nextBusinessDay = this.getNextBusinessDay(today, preferences.businessHours.days);
      const sendTime = new Date(nextBusinessDay);
      sendTime.setHours(
        parseInt(preferences.businessHours.start.split(':')[0]),
        parseInt(preferences.businessHours.start.split(':')[1])
      );
      
      return sendTime.toISOString();
    }
  }

  /**
   * Filtrar canales según preferencias del usuario
   */
  private filterChannelsByPreferences(
    availableChannels: string[],
    preferences?: SmartScheduleOptions['preferences']
  ): string[] {
    if (!preferences?.preferredChannels) {
      return availableChannels;
    }

    return availableChannels.filter(channel => 
      preferences.preferredChannels.includes(channel)
    );
  }

  /**
   * Convertir tiempo HH:mm a minutos
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Obtener próximo día laboral
   */
  private getNextBusinessDay(startDate: Date, businessDays: number[]): Date {
    const nextDay = new Date(startDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (!businessDays.includes(nextDay.getDay())) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }

  /**
   * Mapear datos de base de datos a interfaz
   */
  private mapToScheduledNotification(data: any): ScheduledNotification {
    return {
      id: data.id,
      userId: data.user_id,
      templateId: data.template_id,
      ruleId: data.rule_id,
      channels: data.channels,
      subject: data.subject,
      content: data.content,
      htmlContent: data.html_content,
      variables: data.variables,
      scheduledFor: data.scheduled_for,
      status: data.status,
      attempts: data.attempts,
      maxAttempts: data.max_attempts,
      lastAttemptAt: data.last_attempt_at,
      errorMessage: data.error_message,
      sentAt: data.sent_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // =====================================================
  // MÉTODOS DE ANÁLISIS
  // =====================================================

  /**
   * Obtener estadísticas de notificaciones programadas
   */
  async getScheduledNotificationStats(userId?: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
  }> {
    try {
      let query = supabase
        .from('scheduled_notifications')
        .select('status');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(n => n.status === 'pending').length,
        sent: data.filter(n => n.status === 'sent').length,
        failed: data.filter(n => n.status === 'failed').length,
        cancelled: data.filter(n => n.status === 'cancelled').length
      };

      return stats;
    } catch (error) {
      console.error('Error getting scheduled notification stats:', error);
      throw error;
    }
  }

  /**
   * Limpiar notificaciones programadas antiguas
   */
  async cleanupOldScheduledNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('scheduled_notifications')
        .delete()
        .in('status', ['sent', 'failed', 'cancelled'])
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;
    } catch (error) {
      console.error('Error cleaning up old scheduled notifications:', error);
      throw error;
    }
  }
}

// =====================================================
// INSTANCIA SINGLETON
// =====================================================

export const scheduledNotificationService = ScheduledNotificationService.getInstance();

