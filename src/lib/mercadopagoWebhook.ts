import { supabase } from './supabase';
import { mercadopagoSyncService } from './mercadopagoSyncService';

export interface MercadoPagoWebhookData {
  type: string;
  data: {
    id: number;
  };
}

export interface WebhookResult {
  success: boolean;
  message: string;
  processed: boolean;
}

class MercadoPagoWebhookHandler {
  // Procesar webhook de MercadoPago
  async processWebhook(webhookData: MercadoPagoWebhookData): Promise<WebhookResult> {
    try {
      const { type, data } = webhookData;
      
      if (type !== 'payment') {
        return {
          success: false,
          message: `Tipo de webhook no soportado: ${type}`,
          processed: false
        };
      }

      const paymentId = data.id;
      
      // Obtener información del pago desde MercadoPago
      const paymentInfo = await this.getPaymentFromMercadoPago(paymentId);
      
      if (!paymentInfo) {
        return {
          success: false,
          message: `No se pudo obtener información del pago ${paymentId}`,
          processed: false
        };
      }

      // Buscar el pago en Supabase por ID de MercadoPago
      const { data: existingPayments, error: searchError } = await supabase
        .from('payments')
        .select('*')
        .eq('mercadopagoId', paymentId.toString());
      
      if (searchError) {
        throw new Error(`Error buscando pago: ${searchError.message}`);
      }

      if (existingPayments && existingPayments.length > 0) {
        // Actualizar pago existente
        const paymentDoc = existingPayments[0];
        const updateResult = await this.updateExistingPayment(paymentDoc.id, paymentInfo);
        
        if (updateResult.success) {
          return {
            success: true,
            message: `Pago ${paymentId} actualizado exitosamente`,
            processed: true
          };
        } else {
          return {
            success: false,
            message: `Error actualizando pago: ${updateResult.error}`,
            processed: false
          };
        }
      } else {
        // Crear nuevo pago
        const createResult = await this.createNewPayment(paymentInfo);
        
        if (createResult.success) {
          return {
            success: true,
            message: `Pago ${paymentId} creado exitosamente`,
            processed: true
          };
        } else {
          return {
            success: false,
            message: `Error creando pago: ${createResult.error}`,
            processed: false
          };
        }
      }

    } catch (error) {
      console.error('Error procesando webhook:', error);
      return {
        success: false,
        message: `Error inesperado: ${error.message}`,
        processed: false
      };
    }
  }

  // Obtener información del pago desde MercadoPago
  private async getPaymentFromMercadoPago(paymentId: number): Promise<any> {
    try {
          const accessToken = import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN;
    const baseUrl = import.meta.env.VITE_MERCADOPAGO_API_URL || 'https://api.mercadopago.com';
      
      if (!accessToken) {
        throw new Error('Token de acceso de MercadoPago no configurado');
      }

      const response = await fetch(`${baseUrl}/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error API MercadoPago: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error obteniendo pago de MercadoPago:', error);
      throw error;
    }
  }

  // Actualizar pago existente
  private async updateExistingPayment(paymentId: string, mercadopagoData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: this.mapMercadoPagoStatus(mercadopagoData.status),
          mercadopagoStatus: mercadopagoData.status,
          paymentMethod: mercadopagoData.payment_method?.type,
          installments: mercadopagoData.installments,
          paidAt: mercadopagoData.status === 'approved' ? mercadopagoData.date_last_updated : null,
          updatedAt: new Date().toISOString(),
          metadata: {
            mercadopagoPayment: mercadopagoData,
            webhookProcessedAt: new Date().toISOString()
          }
        })
        .eq('id', paymentId);

      if (updateError) {
        throw new Error(`Error actualizando pago: ${updateError.message}`);
      }

      return { success: true };

    } catch (error) {
      console.error('Error actualizando pago existente:', error);
      return { success: false, error: error.message };
    }
  }

  // Crear nuevo pago
  private async createNewPayment(mercadopagoData: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Obtener ID de usuario por email
      const userId = await this.getUserIdByEmail(mercadopagoData.payer?.email);
      
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
                  userId: userId,
        user_email: mercadopagoData.payer?.email,
        user_name: mercadopagoData.payer?.name || 'Usuario',
          paymentType: this.determinePaymentType(mercadopagoData),
          amount: Math.round(mercadopagoData.transaction_amount * 100), // Convertir a centavos
          currency: mercadopagoData.currency,
          status: this.mapMercadoPagoStatus(mercadopagoData.status),
          mercadopagoId: mercadopagoData.id.toString(),
          mercadopagoStatus: mercadopagoData.status,
          paymentMethod: mercadopagoData.payment_method?.type,
          installments: mercadopagoData.installments,
          description: mercadopagoData.description || 'Pago recibido vía webhook',
          features: this.determineFeatures(mercadopagoData),
          createdAt: mercadopagoData.date_created,
          updatedAt: mercadopagoData.date_last_updated,
          paidAt: mercadopagoData.status === 'approved' ? mercadopagoData.date_last_updated : null,
          metadata: {
            mercadopagoPayment: mercadopagoData,
            createdViaWebhook: true,
            webhookProcessedAt: new Date().toISOString()
          }
        });

      if (insertError) {
        throw new Error(`Error creando pago: ${insertError.message}`);
      }

      return { success: true };

    } catch (error) {
      console.error('Error creando nuevo pago:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener ID de usuario por email
  private async getUserIdByEmail(email: string): Promise<string> {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    return user?.id || 'unknown';
  }

  // Mapear estado de MercadoPago a estado interno
  private mapMercadoPagoStatus(mpStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'approved': 'approved',
      'pending': 'pending',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'in_process': 'pending',
      'authorized': 'pending'
    };

    return statusMap[mpStatus] || 'unknown';
  }

  // Determinar tipo de pago basado en la descripción
  private determinePaymentType(mpPayment: any): string {
    const description = mpPayment.description?.toLowerCase() || '';
    
    if (description.includes('premium') || description.includes('pro')) return 'premium';
    if (description.includes('basic')) return 'basic';
    if (description.includes('enterprise')) return 'enterprise';
    
    return 'custom';
  }

  // Determinar características del plan
  private determineFeatures(mpPayment: any): string[] {
    const description = mpPayment.description?.toLowerCase() || '';
    
    if (description.includes('premium') || description.includes('pro')) {
      return ['Proyectos ilimitados', 'Soporte prioritario', 'Analytics avanzados'];
    }
    if (description.includes('basic')) {
      return ['5 proyectos', 'Soporte por email', 'Funciones básicas'];
    }
    if (description.includes('enterprise')) {
      return ['Proyectos ilimitados', 'Soporte 24/7', 'API personalizada', 'Onboarding dedicado'];
    }
    
    return ['Funciones personalizadas'];
  }

  // Verificar autenticidad del webhook (en producción)
  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    try {
      // En producción, implementar verificación de firma HMAC
      // Por ahora retornamos true para desarrollo
      return true;
    } catch (error) {
      console.error('Error verificando firma del webhook:', error);
      return false;
    }
  }
}

export const mercadopagoWebhookHandler = new MercadoPagoWebhookHandler();
