import { supabase } from './supabase';

interface MercadoPagoPayment {
  id: number;
  status: string;
  transaction_amount: number;
  currency: string;
  payment_method: {
    type: string;
  };
  installments: number;
  description?: string;
  payer?: {
    name?: string;
    email?: string;
  };
  date_created: string;
  date_last_updated: string;
}

interface SyncResult {
  success: boolean;
  syncedPayments: number;
  errors: string[];
  message: string;
}

class MercadoPagoSyncService {
  private accessToken: string;
  private baseUrl: string;

  constructor() {
    this.accessToken = import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN || '';
    this.baseUrl = import.meta.env.VITE_MERCADOPAGO_API_URL || 'https://api.mercadopago.com';
  }

  // Obtener pagos de MercadoPago por email del usuario
  private async getMercadoPagoPayments(userEmail: string): Promise<MercadoPagoPayment[]> {
    try {
      if (!this.accessToken) {
        throw new Error('Token de acceso de MercadoPago no configurado');
      }

      // Buscar pagos en MercadoPago por email del usuario
      const response = await fetch(`${this.baseUrl}/v1/payments/search?email=${encodeURIComponent(userEmail)}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error API MercadoPago: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];

    } catch (error) {
      console.error('Error obteniendo pagos de MercadoPago:', error);
      throw error;
    }
  }

  // Sincronizar un pago individual
  private async syncSinglePayment(mpPayment: MercadoPagoPayment, userEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar si el pago ya existe en Supabase
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('mercadopago_id', mpPayment.id.toString())
        .single();

      if (existingPayment) {
        // Actualizar pago existente
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: this.mapMercadoPagoStatus(mpPayment.status),
            mercadopago_status: mpPayment.status,
            payment_method: mpPayment.payment_method?.type,
            installments: mpPayment.installments,
            paid_at: mpPayment.status === 'approved' ? mpPayment.date_last_updated : null,
            updated_at: new Date().toISOString(),
            metadata: {
              mercadopagoPayment: mpPayment,
              lastSync: new Date().toISOString()
            }
          })
          .eq('id', existingPayment.id);

        if (updateError) {
          throw new Error(`Error actualizando pago: ${updateError.message}`);
        }

        return { success: true };
      } else {
        // Crear nuevo pago - usar user_email en lugar de user_id
        const { error: insertError } = await supabase
          .from('payments')
          .insert({
            user_email: userEmail,
            user_name: mpPayment.payer?.name || 'Usuario',
            payment_type: this.determinePaymentType(mpPayment),
            amount: Math.round(mpPayment.transaction_amount * 100), // Convertir a centavos
            currency: mpPayment.currency,
            status: this.mapMercadoPagoStatus(mpPayment.status),
            mercadopago_id: mpPayment.id.toString(),
            mercadopago_status: mpPayment.status,
            payment_method: mpPayment.payment_method?.type,
            installments: mpPayment.installments,
            description: mpPayment.description || 'Pago sincronizado desde MercadoPago',
            features: this.determineFeatures(mpPayment),
            created_at: mpPayment.date_created,
            updated_at: mpPayment.date_last_updated,
            paid_at: mpPayment.status === 'approved' ? mpPayment.date_last_updated : null,
            metadata: {
              mercadopagoPayment: mpPayment,
              syncedAt: new Date().toISOString()
            }
          });

        if (insertError) {
          throw new Error(`Error creando pago: ${insertError.message}`);
        }

        return { success: true };
      }

    } catch (error) {
      console.error('Error sincronizando pago individual:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener ID de usuario por email - simplificado para evitar problemas de permisos
  private async getUserIdByEmail(email: string): Promise<string | null> {
    try {
      // Intentar obtener el user_id si es posible
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (error) {
        console.warn('No se pudo obtener user_id, usando email:', error.message);
        return null; // Retornar null en lugar de 'unknown'
      }

      return user?.id || null;
    } catch (error) {
      console.warn('Error obteniendo user_id, usando email:', error);
      return null;
    }
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
  private determinePaymentType(mpPayment: MercadoPagoPayment): string {
    const description = mpPayment.description?.toLowerCase() || '';
    
    if (description.includes('premium') || description.includes('pro')) return 'premium';
    if (description.includes('basic')) return 'basic';
    if (description.includes('enterprise')) return 'enterprise';
    
    return 'custom';
  }

  // Determinar características del plan
  private determineFeatures(mpPayment: MercadoPagoPayment): string[] {
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

  // Verificar conexión con MercadoPago
  async testConnection(): Promise<boolean> {
    try {
      if (!this.accessToken) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/v1/payments/search?limit=1`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error probando conexión con MercadoPago:', error);
      return false;
    }
  }

  // Obtener estadísticas de sincronización
  async getSyncStats(userEmail: string): Promise<{
    totalPayments: number;
    syncedPayments: number;
    pendingPayments: number;
    lastSync: string | null;
  }> {
    try {
      // Pagos en Supabase
      const { data: supabasePayments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', userEmail);

      // Si hay error de RLS o permisos, retornar estadísticas vacías
      if (error) {
        console.warn('Error obteniendo pagos (posiblemente RLS o sin permisos):', error);
        // Retornar estadísticas vacías en lugar de lanzar error
        return {
          totalPayments: 0,
          syncedPayments: 0,
          pendingPayments: 0,
          lastSync: null
        };
      }

      const totalPayments = supabasePayments?.length || 0;
      const syncedPayments = supabasePayments?.filter(p => p.mercadopago_id)?.length || 0;
      const pendingPayments = supabasePayments?.filter(p => p.status === 'pending')?.length || 0;
      
      // Última sincronización
      const lastSync = supabasePayments
        ?.filter(p => p.metadata?.lastSync)
        ?.sort((a, b) => new Date(b.metadata.lastSync).getTime() - new Date(a.metadata.lastSync).getTime())[0]
        ?.metadata?.lastSync || null;

      return {
        totalPayments,
        syncedPayments,
        pendingPayments,
        lastSync
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas de sincronización:', error);
      // Retornar estadísticas vacías en lugar de lanzar error
      return {
        totalPayments: 0,
        syncedPayments: 0,
        pendingPayments: 0,
        lastSync: null
      };
    }
  }

  // Sincronizar pagos desde MercadoPago
  async syncPayments(userEmail: string): Promise<SyncResult> {
    try {
      // Obtener pagos de MercadoPago
      const mpPayments = await this.getMercadoPagoPayments(userEmail);
      
      if (!mpPayments || mpPayments.length === 0) {
        return {
          success: true,
          syncedPayments: 0,
          errors: [],
          message: 'No se encontraron pagos pendientes en MercadoPago para sincronizar'
        };
      }

      let syncedCount = 0;
      const errors: string[] = [];

      // Sincronizar cada pago
      for (const mpPayment of mpPayments) {
        try {
          const result = await this.syncSinglePayment(mpPayment, userEmail);
          if (result.success) {
            syncedCount++;
          } else if (result.error) {
            errors.push(`Pago ${mpPayment.id}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`Pago ${mpPayment.id}: ${error.message}`);
        }
      }

      const success = errors.length === 0;
      const message = success 
        ? `Sincronización completada. ${syncedCount} pagos sincronizados exitosamente.`
        : `Sincronización parcial. ${syncedCount} pagos sincronizados, ${errors.length} errores.`;

      return {
        success,
        syncedPayments: syncedCount,
        errors,
        message
      };

    } catch (error) {
      console.error('Error en sincronización de pagos:', error);
      return {
        success: false,
        syncedPayments: 0,
        errors: [error.message],
        message: 'Error durante la sincronización de pagos'
      };
    }
  }
}

export const mercadopagoSyncService = new MercadoPagoSyncService();
