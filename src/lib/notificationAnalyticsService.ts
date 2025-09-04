import { supabase } from './supabase';

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

export interface NotificationAnalytics {
  id: string;
  date: string;
  channel: string;
  category: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  failed_count: number;
  bounce_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalFailed: number;
  totalBounce: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface ChannelPerformance {
  channel: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  bounce: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface CategoryPerformance {
  category: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  bounce: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface TimeSeriesData {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  bounce: number;
}

// =====================================================
// SERVICIO DE ANALYTICS DE NOTIFICACIONES
// =====================================================

export class NotificationAnalyticsService {
  private static instance: NotificationAnalyticsService;

  private constructor() {}

  public static getInstance(): NotificationAnalyticsService {
    if (!NotificationAnalyticsService.instance) {
      NotificationAnalyticsService.instance = new NotificationAnalyticsService();
    }
    return NotificationAnalyticsService.instance;
  }

  // =====================================================
  // MÉTODOS PRINCIPALES
  // =====================================================

  /**
   * Obtener analytics por rango de fechas
   */
  async getAnalyticsByDateRange(
    startDate: string,
    endDate: string,
    channel?: string,
    category?: string
  ): Promise<NotificationAnalytics[]> {
    try {
      let query = supabase
        .from('notification_analytics')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (channel) {
        query = query.eq('channel', channel);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting analytics by date range:', error);
      throw error;
    }
  }

  /**
   * Obtener analytics de los últimos N días
   */
  async getAnalyticsLastDays(days: number = 30): Promise<NotificationAnalytics[]> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      return await this.getAnalyticsByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Error getting analytics last days:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen general de analytics
   */
  async getAnalyticsSummary(
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsSummary> {
    try {
      let query = supabase.from('notification_analytics').select('*');

      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const analytics = data || [];

      const totalSent = analytics.reduce((sum, item) => sum + item.sent_count, 0);
      const totalDelivered = analytics.reduce((sum, item) => sum + item.delivered_count, 0);
      const totalOpened = analytics.reduce((sum, item) => sum + item.opened_count, 0);
      const totalClicked = analytics.reduce((sum, item) => sum + item.clicked_count, 0);
      const totalFailed = analytics.reduce((sum, item) => sum + item.failed_count, 0);
      const totalBounce = analytics.reduce((sum, item) => sum + item.bounce_count, 0);

      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
      const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

      return {
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalFailed,
        totalBounce,
        deliveryRate,
        openRate,
        clickRate
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      throw error;
    }
  }

  /**
   * Obtener rendimiento por canal
   */
  async getChannelPerformance(
    startDate?: string,
    endDate?: string
  ): Promise<ChannelPerformance[]> {
    try {
      let query = supabase.from('notification_analytics').select('*');

      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const analytics = data || [];
      const channelMap = new Map<string, ChannelPerformance>();

      analytics.forEach(item => {
        if (!channelMap.has(item.channel)) {
          channelMap.set(item.channel, {
            channel: item.channel,
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            failed: 0,
            bounce: 0,
            deliveryRate: 0,
            openRate: 0,
            clickRate: 0
          });
        }

        const channel = channelMap.get(item.channel)!;
        channel.sent += item.sent_count;
        channel.delivered += item.delivered_count;
        channel.opened += item.opened_count;
        channel.clicked += item.clicked_count;
        channel.failed += item.failed_count;
        channel.bounce += item.bounce_count;
      });

      // Calcular tasas
      channelMap.forEach(channel => {
        channel.deliveryRate = channel.sent > 0 ? (channel.delivered / channel.sent) * 100 : 0;
        channel.openRate = channel.delivered > 0 ? (channel.opened / channel.delivered) * 100 : 0;
        channel.clickRate = channel.opened > 0 ? (channel.clicked / channel.opened) * 100 : 0;
      });

      return Array.from(channelMap.values());
    } catch (error) {
      console.error('Error getting channel performance:', error);
      throw error;
    }
  }

  /**
   * Obtener rendimiento por categoría
   */
  async getCategoryPerformance(
    startDate?: string,
    endDate?: string
  ): Promise<CategoryPerformance[]> {
    try {
      let query = supabase.from('notification_analytics').select('*');

      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const analytics = data || [];
      const categoryMap = new Map<string, CategoryPerformance>();

      analytics.forEach(item => {
        if (!categoryMap.has(item.category)) {
          categoryMap.set(item.category, {
            category: item.category,
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            failed: 0,
            bounce: 0,
            deliveryRate: 0,
            openRate: 0,
            clickRate: 0
          });
        }

        const category = categoryMap.get(item.category)!;
        category.sent += item.sent_count;
        category.delivered += item.delivered_count;
        category.opened += item.opened_count;
        category.clicked += item.clicked_count;
        category.failed += item.failed_count;
        category.bounce += item.bounce_count;
      });

      // Calcular tasas
      categoryMap.forEach(category => {
        category.deliveryRate = category.sent > 0 ? (category.delivered / category.sent) * 100 : 0;
        category.openRate = category.delivered > 0 ? (category.opened / category.delivered) * 100 : 0;
        category.clickRate = category.opened > 0 ? (category.clicked / category.opened) * 100 : 0;
      });

      return Array.from(categoryMap.values());
    } catch (error) {
      console.error('Error getting category performance:', error);
      throw error;
    }
  }

  /**
   * Obtener datos de series temporales
   */
  async getTimeSeriesData(
    days: number = 30,
    channel?: string,
    category?: string
  ): Promise<TimeSeriesData[]> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let query = supabase
        .from('notification_analytics')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (channel) {
        query = query.eq('channel', channel);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      const analytics = data || [];
      const dateMap = new Map<string, TimeSeriesData>();

      // Agrupar por fecha
      analytics.forEach(item => {
        if (!dateMap.has(item.date)) {
          dateMap.set(item.date, {
            date: item.date,
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            failed: 0,
            bounce: 0
          });
        }

        const dateData = dateMap.get(item.date)!;
        dateData.sent += item.sent_count;
        dateData.delivered += item.delivered_count;
        dateData.opened += item.opened_count;
        dateData.clicked += item.clicked_count;
        dateData.failed += item.failed_count;
        dateData.bounce += item.bounce_count;
      });

      return Array.from(dateMap.values());
    } catch (error) {
      console.error('Error getting time series data:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS DE ACTUALIZACIÓN
  // =====================================================

  /**
   * Actualizar analytics para una notificación
   */
  async updateNotificationAnalytics(
    date: string,
    channel: string,
    category: string,
    status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced'
  ): Promise<void> {
    try {
      const { data: existing, error: selectError } = await supabase
        .from('notification_analytics')
        .select('*')
        .eq('date', date)
        .eq('channel', channel)
        .eq('category', category)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      if (existing) {
        // Actualizar registro existente
        const updateData: any = {};
        updateData[`${status}_count`] = existing[`${status}_count`] + 1;
        updateData.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('notification_analytics')
          .update(updateData)
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Crear nuevo registro
        const insertData = {
          date,
          channel,
          category,
          sent_count: status === 'sent' ? 1 : 0,
          delivered_count: status === 'delivered' ? 1 : 0,
          opened_count: status === 'opened' ? 1 : 0,
          clicked_count: status === 'clicked' ? 1 : 0,
          failed_count: status === 'failed' ? 1 : 0,
          bounce_count: status === 'bounced' ? 1 : 0
        };

        const { error: insertError } = await supabase
          .from('notification_analytics')
          .insert(insertData);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating notification analytics:', error);
      throw error;
    }
  }

  /**
   * Actualizar analytics en lote
   */
  async updateBatchAnalytics(updates: Array<{
    date: string;
    channel: string;
    category: string;
    status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced';
  }>): Promise<void> {
    try {
      for (const update of updates) {
        await this.updateNotificationAnalytics(
          update.date,
          update.channel,
          update.category,
          update.status
        );
      }
    } catch (error) {
      console.error('Error updating batch analytics:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS DE LIMPIEZA
  // =====================================================

  /**
   * Limpiar analytics antiguos
   */
  async cleanupOldAnalytics(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { error } = await supabase
        .from('notification_analytics')
        .delete()
        .lt('date', cutoffDate);

      if (error) throw error;
    } catch (error) {
      console.error('Error cleaning up old analytics:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de rendimiento del sistema
   */
  async getSystemPerformanceStats(): Promise<{
    totalNotifications: number;
    averageDeliveryRate: number;
    averageOpenRate: number;
    averageClickRate: number;
    topPerformingChannel: string;
    topPerformingCategory: string;
  }> {
    try {
      const summary = await this.getAnalyticsSummary();
      const channels = await this.getChannelPerformance();
      const categories = await this.getCategoryPerformance();

      const topChannel = channels.reduce((best, current) => 
        current.deliveryRate > best.deliveryRate ? current : best
      );

      const topCategory = categories.reduce((best, current) => 
        current.deliveryRate > best.deliveryRate ? current : best
      );

      return {
        totalNotifications: summary.totalSent,
        averageDeliveryRate: summary.deliveryRate,
        averageOpenRate: summary.openRate,
        averageClickRate: summary.clickRate,
        topPerformingChannel: topChannel.channel,
        topPerformingCategory: topCategory.category
      };
    } catch (error) {
      console.error('Error getting system performance stats:', error);
      throw error;
    }
  }
}

// =====================================================
// INSTANCIA SINGLETON
// =====================================================

export const notificationAnalyticsService = NotificationAnalyticsService.getInstance();

