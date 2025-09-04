import { supabase } from './supabase';
import { notificationService } from './notificationService';

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

export interface NotificationChannel {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'email' | 'push' | 'sms' | 'in_app' | 'webhook';
  isActive: boolean;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryAfter?: number;
  channel: string;
  timestamp: string;
}

export interface UserChannelSubscription {
  id: string;
  userId: string;
  channelId: string;
  isEnabled: boolean;
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  deviceInfo: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// CLASE BASE PARA CANALES DE NOTIFICACIÓN
// =====================================================

export abstract class BaseNotificationChannel {
  abstract name: string;
  abstract type: string;
  abstract displayName: string;
  
  abstract send(notification: any, user: any, config?: Record<string, any>): Promise<ChannelDeliveryResult>;
  abstract validateConfig(config: Record<string, any>): boolean;
  abstract getDeliveryStatus(messageId: string): Promise<string>;
  
  protected async logDelivery(
    notificationId: string,
    userId: string,
    channelId: string,
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced',
    result: ChannelDeliveryResult
  ): Promise<void> {
    try {
      await supabase
        .from('notification_delivery_logs')
        .insert({
          notification_id: notificationId,
          user_id: userId,
          channel_id: channelId,
          status,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
          delivered_at: status === 'delivered' ? new Date().toISOString() : null,
          error_message: result.error || null,
          metadata: {
            channel: this.name,
            messageId: result.messageId,
            retryAfter: result.retryAfter
          }
        });
    } catch (error) {
      console.error(`Error logging delivery for channel ${this.name}:`, error);
    }
  }
}

// =====================================================
// IMPLEMENTACIÓN DE CANAL DE EMAIL
// =====================================================

export class EmailNotificationChannel extends BaseNotificationChannel {
  name = 'email';
  type = 'email';
  displayName = 'Email';
  
  async send(notification: any, user: any, config?: Record<string, any>): Promise<ChannelDeliveryResult> {
    try {
      // Aquí se integraría con el servicio de email existente
      // Por ahora simulamos el envío
      const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simular envío exitoso
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result: ChannelDeliveryResult = {
        success: true,
        messageId,
        channel: this.name,
        timestamp: new Date().toISOString()
      };
      
      // Log del envío
      await this.logDelivery(notification.id, user.id, 'email', 'sent', result);
      
      return result;
    } catch (error) {
      const result: ChannelDeliveryResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        channel: this.name,
        timestamp: new Date().toISOString()
      };
      
      await this.logDelivery(notification.id, user.id, 'email', 'failed', result);
      return result;
    }
  }
  
  validateConfig(config: Record<string, any>): boolean {
    return config && config.smtp && config.from && config.to;
  }
  
  async getDeliveryStatus(messageId: string): Promise<string> {
    // Implementar verificación de estado de email
    return 'delivered';
  }
}

// =====================================================
// IMPLEMENTACIÓN DE CANAL DE PUSH
// =====================================================

export class PushNotificationChannel extends BaseNotificationChannel {
  name = 'push';
  type = 'push';
  displayName = 'Push Notifications';
  
  async send(notification: any, user: any, config?: Record<string, any>): Promise<ChannelDeliveryResult> {
    try {
      // Obtener suscripciones push del usuario
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error || !subscriptions || subscriptions.length === 0) {
        throw new Error('No active push subscriptions found');
      }
      
      // Enviar a todas las suscripciones activas
      const results = await Promise.allSettled(
        subscriptions.map(sub => this.sendToSubscription(notification, sub))
      );
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const messageId = `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result: ChannelDeliveryResult = {
        success: successCount > 0,
        messageId,
        channel: this.name,
        timestamp: new Date().toISOString()
      };
      
      if (successCount === 0) {
        result.error = 'Failed to send to all subscriptions';
      }
      
      await this.logDelivery(notification.id, user.id, 'push', result.success ? 'sent' : 'failed', result);
      return result;
    } catch (error) {
      const result: ChannelDeliveryResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        channel: this.name,
        timestamp: new Date().toISOString()
      };
      
      await this.logDelivery(notification.id, user.id, 'push', 'failed', result);
      return result;
    }
  }
  
  private async sendToSubscription(notification: any, subscription: PushSubscription): Promise<boolean> {
    try {
      // Aquí se implementaría el envío real usando Web Push API
      // Por ahora simulamos el envío
      await new Promise(resolve => setTimeout(resolve, 50));
      return true;
    } catch (error) {
      console.error('Error sending push to subscription:', error);
      return false;
    }
  }
  
  validateConfig(config: Record<string, any>): boolean {
    return config && config.vapidPublicKey && config.vapidPrivateKey;
  }
  
  async getDeliveryStatus(messageId: string): Promise<string> {
    // Implementar verificación de estado de push
    return 'delivered';
  }
}

// =====================================================
// IMPLEMENTACIÓN DE CANAL IN-APP
// =====================================================

export class InAppNotificationChannel extends BaseNotificationChannel {
  name = 'in_app';
  type = 'in_app';
  displayName = 'In-App Notifications';
  
  async send(notification: any, user: any, config?: Record<string, any>): Promise<ChannelDeliveryResult> {
    try {
      // Las notificaciones in-app se manejan directamente en la base de datos
      // Solo necesitamos verificar que se creó correctamente
      const messageId = `inapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result: ChannelDeliveryResult = {
        success: true,
        messageId,
        channel: this.name,
        timestamp: new Date().toISOString()
      };
      
      await this.logDelivery(notification.id, user.id, 'in_app', 'sent', result);
      return result;
    } catch (error) {
      const result: ChannelDeliveryResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        channel: this.name,
        timestamp: new Date().toISOString()
      };
      
      await this.logDelivery(notification.id, user.id, 'in_app', 'failed', result);
      return result;
    }
  }
  
  validateConfig(config: Record<string, any>): boolean {
    return true; // No requiere configuración especial
  }
  
  async getDeliveryStatus(messageId: string): Promise<string> {
    return 'delivered';
  }
}

// =====================================================
// IMPLEMENTACIÓN DE CANAL WEBHOOK
// =====================================================

export class WebhookNotificationChannel extends BaseNotificationChannel {
  name = 'webhook';
  type = 'webhook';
  displayName = 'Webhook';
  
  async send(notification: any, user: any, config?: Record<string, any>): Promise<ChannelDeliveryResult> {
    try {
      if (!config?.webhookUrl) {
        throw new Error('Webhook URL not configured');
      }
      
      const payload = {
        notification,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name
        },
        timestamp: new Date().toISOString(),
        channel: this.name
      };
      
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.authHeader || '',
          'X-Webhook-Signature': this.generateSignature(payload, config.secretKey || '')
        },
        body: JSON.stringify(payload)
      });
      
      const messageId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }
      
      const result: ChannelDeliveryResult = {
        success: true,
        messageId,
        channel: this.name,
        timestamp: new Date().toISOString()
      };
      
      await this.logDelivery(notification.id, user.id, 'webhook', 'sent', result);
      return result;
    } catch (error) {
      const result: ChannelDeliveryResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        channel: this.name,
        timestamp: new Date().toISOString()
      };
      
      await this.logDelivery(notification.id, user.id, 'webhook', 'failed', result);
      return result;
    }
  }
  
  private generateSignature(payload: any, secretKey: string): string {
    // Implementar generación de firma HMAC
    return btoa(JSON.stringify(payload) + secretKey);
  }
  
  validateConfig(config: Record<string, any>): boolean {
    return config && config.webhookUrl;
  }
  
  async getDeliveryStatus(messageId: string): Promise<string> {
    return 'delivered';
  }
}

// =====================================================
// SERVICIO PRINCIPAL DE CANALES
// =====================================================

export class NotificationChannelService {
  private channels: Map<string, BaseNotificationChannel> = new Map();
  
  constructor() {
    this.registerDefaultChannels();
  }
  
  private registerDefaultChannels(): void {
    this.channels.set('email', new EmailNotificationChannel());
    this.channels.set('push', new PushNotificationChannel());
    this.channels.set('in_app', new InAppNotificationChannel());
    this.channels.set('webhook', new WebhookNotificationChannel());
  }
  
  // Registrar un nuevo canal
  registerChannel(channel: BaseNotificationChannel): void {
    this.channels.set(channel.name, channel);
  }
  
  // Obtener canal por nombre
  getChannel(name: string): BaseNotificationChannel | undefined {
    return this.channels.get(name);
  }
  
  // Obtener todos los canales
  getAllChannels(): BaseNotificationChannel[] {
    return Array.from(this.channels.values());
  }
  
  // Obtener canales activos
  getActiveChannels(): BaseNotificationChannel[] {
    return Array.from(this.channels.values()).filter(channel => channel.isActive);
  }
  
  // Enviar notificación por múltiples canales
  async sendToChannels(
    notification: any,
    user: any,
    channelNames: string[],
    configs?: Record<string, Record<string, any>>
  ): Promise<ChannelDeliveryResult[]> {
    const results: ChannelDeliveryResult[] = [];
    
    for (const channelName of channelNames) {
      const channel = this.channels.get(channelName);
      if (!channel) {
        results.push({
          success: false,
          error: `Channel ${channelName} not found`,
          channel: channelName,
          timestamp: new Date().toISOString()
        });
        continue;
      }
      
      try {
        const config = configs?.[channelName] || {};
        const result = await channel.send(notification, user, config);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          channel: channelName,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }
  
  // Obtener canales disponibles para un usuario
  async getUserChannels(userId: string): Promise<NotificationChannel[]> {
    try {
      const { data, error } = await supabase
        .from('notification_channels')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting user channels:', error);
      return [];
    }
  }
  
  // Obtener suscripciones de canal de un usuario
  async getUserChannelSubscriptions(userId: string): Promise<UserChannelSubscription[]> {
    try {
      const { data, error } = await supabase
        .from('user_channel_subscriptions')
        .select(`
          *,
          notification_channels (
            id,
            name,
            display_name,
            type
          )
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting user channel subscriptions:', error);
      return [];
    }
  }
  
  // Actualizar suscripción de canal
  async updateChannelSubscription(
    userId: string,
    channelId: string,
    isEnabled: boolean,
    preferences?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_channel_subscriptions')
        .upsert({
          user_id: userId,
          channel_id: channelId,
          is_enabled: isEnabled,
          preferences: preferences || {},
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating channel subscription:', error);
      throw error;
    }
  }
  
  // Obtener suscripciones push de un usuario
  async getUserPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting push subscriptions:', error);
      return [];
    }
  }
  
  // Agregar suscripción push
  async addPushSubscription(
    userId: string,
    subscription: Omit<PushSubscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<PushSubscription> {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          device_info: subscription.deviceInfo,
          is_active: subscription.isActive
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error adding push subscription:', error);
      throw error;
    }
  }
  
  // Desactivar suscripción push
  async deactivatePushSubscription(subscriptionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('id', subscriptionId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deactivating push subscription:', error);
      throw error;
    }
  }
}

// Instancia global del servicio
export const notificationChannelService = new NotificationChannelService();
export default notificationChannelService;
