import { processMercadoPagoWebhook } from './paymentService';
import { supabase } from './supabase';


// Tipos de webhook de Mercado Pago
export interface MercadoPagoWebhook {
  id: string;
  live_mode: boolean;
  type: string;
  date_created: string;
  user_id: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

// Procesar webhook de Mercado Pago
export const handleMercadoPagoWebhook = async (webhookData: MercadoPagoWebhook) => {
  try {


    // Validar que sea un webhook válido
    if (!webhookData || !webhookData.data || !webhookData.data.id) {
      throw new Error('Invalid webhook data');
    }

    // Procesar el pago
    const result = await processMercadoPagoWebhook(webhookData);

    // Registrar el webhook en Supabase para auditoría
    const { error: webhookError } = await supabase
      .from('webhooks')
      .insert({
        provider: 'mercadopago',
        type: webhookData.type,
        action: webhookData.action,
        data: webhookData,
        processed: true,
        result: result,
        createdAt: new Date().toISOString()
      });
    
    if (webhookError) throw webhookError;

    return {
      success: true,
      message: 'Webhook processed successfully',
      paymentId: result.paymentId,
      status: result.status
    };

  } catch (error) {
    console.error('Error processing webhook:', error);

    // Registrar error en Supabase
    const { error: errorLogError } = await supabase
      .from('webhooks')
      .insert({
        provider: 'mercadopago',
        type: webhookData?.type || 'unknown',
        action: webhookData?.action || 'unknown',
        data: webhookData,
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date().toISOString()
      });
    
    if (errorLogError) console.error('Error logging webhook error:', errorLogError);

    throw error;
  }
};

// Función para sincronizar pagos desde la página principal
export const syncPaymentsFromMainSite = async (userEmail: string) => {
  try {
    // En producción, aquí harías una llamada a la API de tu página principal
    // para obtener los pagos que se realizaron allí
    
    const response = await fetch(`https://tuweb-ai.com/api/payments/${userEmail}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payments from main site');
    }

    const payments = await response.json();

    // Procesar cada pago
    for (const payment of payments) {
      await processMercadoPagoWebhook({
        id: payment.webhook_id,
        live_mode: payment.live_mode,
        type: 'payment',
        date_created: payment.date_created,
        user_id: payment.user_id,
        api_version: 'v1',
        action: 'payment.created',
        data: {
          id: payment.mercadopago_id
        }
      });
    }

    return {
      success: true,
      message: `Synced ${payments.length} payments`,
      paymentsCount: payments.length
    };

  } catch (error) {
    console.error('Error syncing payments:', error);
    throw error;
  }
};

// Función para verificar estado de pagos pendientes
export const checkPendingPayments = async () => {
  try {
    
    
    const { data: pendingPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending');
    
    if (paymentsError) throw paymentsError;

    // Verificar cada pago pendiente con Mercado Pago
    for (const payment of pendingPayments) {
      if (payment.mercadopagoId) {
        try {
          // En producción, aquí harías una llamada a la API de Mercado Pago
          // para verificar el estado actual del pago
          const paymentStatus = await checkMercadoPagoPaymentStatus(payment.mercadopagoId);
          
          if (paymentStatus !== payment.status) {
            // Actualizar estado si cambió
            await processMercadoPagoWebhook({
              id: `check_${payment.mercadopagoId}`,
              live_mode: true,
              type: 'payment',
              date_created: new Date().toISOString(),
              user_id: 0,
              api_version: 'v1',
              action: 'payment.updated',
              data: {
                id: payment.mercadopagoId
              }
            });
          }
        } catch (error) {
          console.error(`Error checking payment ${payment.mercadopagoId}:`, error);
        }
      }
    }

    return {
      success: true,
      message: `Checked ${pendingPayments.length} pending payments`
    };

  } catch (error) {
    console.error('Error checking pending payments:', error);
    throw error;
  }
};

// Función para verificar estado de pago en Mercado Pago
const checkMercadoPagoPaymentStatus = async (paymentId: string) => {
  // En producción, aquí harías una llamada real a la API de Mercado Pago
  // Por ahora simulamos la respuesta
  return 'approved';
}; 
