import { supabase } from './supabase';

// =====================================================
// TIPOS Y INTERFACES PARA TRIGGERS
// =====================================================

export interface SystemTrigger {
  id: string;
  name: string;
  description?: string;
  event_type: 'project_created' | 'project_status_changed' | 'project_deadline_approaching' | 
             'ticket_created' | 'ticket_priority_changed' | 'ticket_status_changed' |
             'payment_received' | 'payment_failed' | 'user_registered' | 'user_role_changed';
  conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  schedule?: string; // Cron expression
  last_triggered?: string;
  trigger_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTriggerDto {
  name: string;
  description?: string;
  event_type: SystemTrigger['event_type'];
  conditions?: Record<string, any>;
  actions?: Record<string, any>;
  is_active?: boolean;
  schedule?: string;
}

export interface UpdateTriggerDto {
  name?: string;
  description?: string;
  event_type?: SystemTrigger['event_type'];
  conditions?: Record<string, any>;
  actions?: Record<string, any>;
  is_active?: boolean;
  schedule?: string;
}

export interface TriggerEvent {
  type: SystemTrigger['event_type'];
  data: any;
  timestamp: string;
  source: string;
}

// =====================================================
// SERVICIO PRINCIPAL DE TRIGGERS
// =====================================================

export class TriggerService {
  
  // =====================================================
  // GESTIÓN DE TRIGGERS
  // =====================================================

  /**
   * Crear un nuevo trigger
   */
  async createTrigger(trigger: CreateTriggerDto): Promise<SystemTrigger> {
    try {
      const { data, error } = await supabase
        .from('system_triggers')
        .insert({
          ...trigger,
          is_active: trigger.is_active ?? true,
          conditions: trigger.conditions || {},
          actions: trigger.actions || {},
          trigger_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      
      // Log de la creación
      await this.logTriggerAction('trigger', data.id, 'create', 'success', 'Trigger creado exitosamente');
      
      return data;
    } catch (error) {
      await this.logTriggerAction('trigger', 'unknown', 'create', 'error', `Error creando trigger: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener todos los triggers
   */
  async getTriggers(): Promise<SystemTrigger[]> {
    try {
      const { data, error } = await supabase
        .from('system_triggers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting triggers:', error);
      return [];
    }
  }

  /**
   * Obtener trigger por ID
   */
  async getTrigger(id: string): Promise<SystemTrigger | null> {
    try {
      const { data, error } = await supabase
        .from('system_triggers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting trigger:', error);
      return null;
    }
  }

  /**
   * Obtener triggers por tipo de evento
   */
  async getTriggersByEventType(eventType: SystemTrigger['event_type']): Promise<SystemTrigger[]> {
    try {
      const { data, error } = await supabase
        .from('system_triggers')
        .select('*')
        .eq('event_type', eventType)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting triggers by event type:', error);
      return [];
    }
  }

  /**
   * Actualizar trigger
   */
  async updateTrigger(id: string, updates: UpdateTriggerDto): Promise<SystemTrigger> {
    try {
      const { data, error } = await supabase
        .from('system_triggers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await this.logTriggerAction('trigger', id, 'update', 'success', 'Trigger actualizado exitosamente');
      
      return data;
    } catch (error) {
      await this.logTriggerAction('trigger', id, 'update', 'error', `Error actualizando trigger: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar trigger
   */
  async deleteTrigger(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_triggers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await this.logTriggerAction('trigger', id, 'delete', 'success', 'Trigger eliminado exitosamente');
    } catch (error) {
      await this.logTriggerAction('trigger', id, 'delete', 'error', `Error eliminando trigger: ${error.message}`);
      throw error;
    }
  }

  /**
   * Activar/desactivar trigger
   */
  async toggleTrigger(id: string, isActive: boolean): Promise<SystemTrigger> {
    try {
      const { data, error } = await supabase
        .from('system_triggers')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const action = isActive ? 'activado' : 'desactivado';
      await this.logTriggerAction('trigger', id, 'toggle', 'success', `Trigger ${action} exitosamente`);
      
      return data;
    } catch (error) {
      await this.logTriggerAction('trigger', id, 'toggle', 'error', `Error cambiando estado del trigger: ${error.message}`);
      throw error;
    }
  }

  // =====================================================
  // EJECUCIÓN DE TRIGGERS
  // =====================================================

  /**
   * Disparar trigger por evento
   */
  async fireTrigger(eventType: SystemTrigger['event_type'], eventData: any): Promise<void> {
    try {
      // console.log(`🔥 Disparando triggers para evento: ${eventType}`);
      
      // Obtener triggers activos para este tipo de evento
      const triggers = await this.getTriggersByEventType(eventType);
      
      if (triggers.length === 0) {
        // console.log(`ℹ️ No hay triggers activos para el evento: ${eventType}`);
        return;
      }

      // console.log(`📋 Encontrados ${triggers.length} triggers para ejecutar`);

      // Ejecutar cada trigger
      for (const trigger of triggers) {
        try {
          await this.executeTrigger(trigger, eventData);
        } catch (error) {
          console.error(`❌ Error ejecutando trigger ${trigger.id}:`, error);
          await this.logTriggerAction('trigger', trigger.id, 'execute', 'error', `Error ejecutando trigger: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error firing triggers:', error);
      throw error;
    }
  }

  /**
   * Ejecutar trigger específico
   */
  async executeTrigger(trigger: SystemTrigger, eventData: any): Promise<void> {
    try {
      const startTime = Date.now();
      // console.log(`⚡ Ejecutando trigger: ${trigger.name}`);

      // Verificar si el trigger debe ejecutarse según el schedule
      if (trigger.schedule && !this.shouldExecuteBySchedule(trigger.schedule)) {
        // console.log(`⏰ Trigger ${trigger.name} no debe ejecutarse según su schedule`);
        return;
      }

      // Evaluar condiciones
      if (trigger.conditions && Object.keys(trigger.conditions).length > 0) {
        const conditionsMet = await this.evaluateTriggerConditions(trigger.conditions, eventData);
        if (!conditionsMet) {
          // console.log(`❌ Condiciones no cumplidas para trigger ${trigger.name}`);
          await this.logTriggerAction('trigger', trigger.id, 'execute', 'warning', 'Condiciones no cumplidas');
          return;
        }
      }

      // Ejecutar acciones
      if (trigger.actions && Object.keys(trigger.actions).length > 0) {
        await this.executeTriggerActions(trigger.actions, eventData);
      }

      // Actualizar estadísticas del trigger
      await this.updateTriggerStats(trigger.id);

      const executionTime = Date.now() - startTime;
      // console.log(`✅ Trigger ${trigger.name} ejecutado exitosamente en ${executionTime}ms`);
      
      await this.logTriggerAction('trigger', trigger.id, 'execute', 'success', 'Trigger ejecutado exitosamente', {
        execution_time_ms: executionTime,
        event_data: eventData
      });

    } catch (error) {
      console.error(`❌ Error ejecutando trigger ${trigger.name}:`, error);
      await this.logTriggerAction('trigger', trigger.id, 'execute', 'error', `Error ejecutando trigger: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar si el trigger debe ejecutarse según su schedule
   */
  private shouldExecuteBySchedule(schedule: string): boolean {
    try {
      // Implementación básica de cron parsing
      // Por ahora, solo verificamos si es un schedule válido
      if (!schedule || schedule.trim() === '') return true;
      
      // Aquí podrías implementar un parser de cron más robusto
      // Por ahora, asumimos que siempre debe ejecutarse
      return true;
    } catch (error) {
      console.error('Error parsing cron schedule:', error);
      return true; // En caso de error, ejecutar por defecto
    }
  }

  /**
   * Evaluar condiciones del trigger
   */
  private async evaluateTriggerConditions(conditions: Record<string, any>, eventData: any): Promise<boolean> {
    try {
      // Evaluar cada condición
      for (const [field, condition] of Object.entries(conditions)) {
        const value = eventData[field];
        const operator = condition.operator;
        const expectedValue = condition.value;

        switch (operator) {
          case 'equals':
            if (value !== expectedValue) return false;
            break;
          case 'contains':
            if (!String(value).includes(String(expectedValue))) return false;
            break;
          case 'greater_than':
            if (Number(value) <= Number(expectedValue)) return false;
            break;
          case 'less_than':
            if (Number(value) >= Number(expectedValue)) return false;
            break;
          case 'not_equals':
            if (value === expectedValue) return false;
            break;
          case 'in':
            if (!Array.isArray(expectedValue) || !expectedValue.includes(value)) return false;
            break;
          case 'not_in':
            if (Array.isArray(expectedValue) && expectedValue.includes(value)) return false;
            break;
          case 'regex':
            try {
              const regex = new RegExp(expectedValue);
              if (!regex.test(String(value))) return false;
            } catch (regexError) {
              console.error('Error en regex:', regexError);
              return false;
            }
            break;
          default:
            console.warn(`Operador no soportado: ${operator}`);
            return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error evaluating trigger conditions:', error);
      return false;
    }
  }

  /**
   * Ejecutar acciones del trigger
   */
  private async executeTriggerActions(actions: Record<string, any>, eventData: any): Promise<void> {
    try {
      for (const [actionType, actionData] of Object.entries(actions)) {
        switch (actionType) {
          case 'send_notification':
            await this.executeNotificationAction(actionData, eventData);
            break;
          case 'send_email':
            await this.executeEmailAction(actionData, eventData);
            break;
          case 'update_status':
            await this.executeStatusUpdateAction(actionData, eventData);
            break;
          case 'create_ticket':
            await this.executeCreateTicketAction(actionData, eventData);
            break;
          case 'assign_user':
            await this.executeAssignmentAction(actionData, eventData);
            break;
          case 'webhook':
            await this.executeWebhookAction(actionData, eventData);
            break;
          case 'slack_notification':
            await this.executeSlackAction(actionData, eventData);
            break;
          default:
            console.warn(`Acción no soportada: ${actionType}`);
        }
      }
    } catch (error) {
      console.error('Error executing trigger actions:', error);
      throw error;
    }
  }

  // =====================================================
  // ACCIONES ESPECÍFICAS DE TRIGGERS
  // =====================================================

  /**
   * Ejecutar acción de notificación
   */
  private async executeNotificationAction(actionData: any, eventData: any): Promise<void> {
    try {
      // console.log('📢 Ejecutando acción de notificación:', actionData);
      
      // Crear notificación en la base de datos
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: this.interpolateMessage(actionData.title, eventData),
          message: this.interpolateMessage(actionData.message, eventData),
          type: actionData.type || 'info',
          category: 'trigger',
          user_id: actionData.user_id || eventData.user_id,
          project_id: eventData.project_id,
          is_system: true,
          metadata: {
            trigger_action: 'notification',
            event_data: eventData
          }
        });

      if (error) throw error;
      
      // console.log('✅ Notificación creada exitosamente');
    } catch (error) {
      console.error('Error executing notification action:', error);
      throw error;
    }
  }

  /**
   * Ejecutar acción de email
   */
  private async executeEmailAction(actionData: any, eventData: any): Promise<void> {
    try {
      // console.log('📧 Ejecutando acción de email:', actionData);
      
      // Aquí integrarías con tu servicio de email
      const emailData = {
        to: actionData.recipients || [],
        subject: this.interpolateMessage(actionData.subject, eventData),
        body: this.interpolateMessage(actionData.body, eventData),
        template: actionData.template
      };

      // console.log('📧 Datos de email preparados:', emailData);
      
      // Por ahora solo log, pero aquí enviarías el email
      await this.logTriggerAction('trigger', 'email', 'send', 'info', `Email preparado para: ${emailData.to.join(', ')}`);
      
    } catch (error) {
      console.error('Error executing email action:', error);
      throw error;
    }
  }

  /**
   * Ejecutar acción de actualización de estado
   */
  private async executeStatusUpdateAction(actionData: any, eventData: any): Promise<void> {
    try {
      // console.log('🔄 Ejecutando acción de actualización de estado:', actionData);
      
      const table = actionData.table;
      const recordId = eventData[actionData.id_field];
      const newStatus = actionData.new_status;

      if (!table || !recordId || !newStatus) {
        throw new Error('Faltan campos requeridos para actualización de estado');
      }

      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('id', recordId);

      if (error) throw error;
      
      // console.log(`✅ Estado actualizado en ${table} para ID ${recordId}`);
    } catch (error) {
      console.error('Error executing status update action:', error);
      throw error;
    }
  }

  /**
   * Ejecutar acción de crear ticket
   */
  private async executeCreateTicketAction(actionData: any, eventData: any): Promise<void> {
    try {
      // console.log('🎫 Ejecutando acción de crear ticket:', actionData);
      
      const ticketData = {
        title: this.interpolateMessage(actionData.title, eventData),
        description: this.interpolateMessage(actionData.description, eventData),
        priority: actionData.priority || 'medium',
        status: 'open',
        project_id: eventData.project_id,
        user_id: actionData.assignee_id || eventData.user_id,
        category: actionData.category || 'general'
      };

      const { error } = await supabase
        .from('tickets')
        .insert(ticketData);

      if (error) throw error;
      
      // console.log('✅ Ticket creado exitosamente');
    } catch (error) {
      console.error('Error executing create ticket action:', error);
      throw error;
    }
  }

  /**
   * Ejecutar acción de asignación
   */
  private async executeAssignmentAction(actionData: any, eventData: any): Promise<void> {
    try {
      // console.log('👤 Ejecutando acción de asignación:', actionData);
      
      const table = actionData.table;
      const recordId = eventData[actionData.id_field];
      const userId = actionData.user_id;

      if (!table || !recordId || !userId) {
        throw new Error('Faltan campos requeridos para asignación');
      }

      const { error } = await supabase
        .from(table)
        .update({ assigned_to: userId })
        .eq('id', recordId);

      if (error) throw error;
      
      // console.log(`✅ Usuario ${userId} asignado a ${table} ID ${recordId}`);
    } catch (error) {
      console.error('Error executing assignment action:', error);
      throw error;
    }
  }

  /**
   * Ejecutar acción de webhook
   */
  private async executeWebhookAction(actionData: any, eventData: any): Promise<void> {
    try {
      // console.log('🌐 Ejecutando acción de webhook:', actionData);
      
      const url = actionData.url;
      const method = actionData.method || 'POST';
      const headers = actionData.headers || {};
      const body = actionData.body ? this.interpolateMessage(actionData.body, eventData) : eventData;

      if (!url) {
        throw new Error('URL del webhook no especificada');
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Webhook falló con status: ${response.status}`);
      }
      
      // console.log('✅ Webhook ejecutado exitosamente');
    } catch (error) {
      console.error('Error executing webhook action:', error);
      throw error;
    }
  }

  /**
   * Ejecutar acción de Slack
   */
  private async executeSlackAction(actionData: any, eventData: any): Promise<void> {
    try {
      // console.log('💬 Ejecutando acción de Slack:', actionData);
      
      // Aquí integrarías con la API de Slack
      const message = this.interpolateMessage(actionData.message, eventData);
      const channel = actionData.channel || '#general';
      
      // console.log(`💬 Mensaje de Slack preparado para ${channel}: ${message}`);
      
      // Por ahora solo log
      await this.logTriggerAction('trigger', 'slack', 'send', 'info', `Mensaje de Slack preparado para: ${channel}`);
      
    } catch (error) {
      console.error('Error executing Slack action:', error);
      throw error;
    }
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  /**
   * Interpolar mensajes con datos del evento
   */
  private interpolateMessage(message: string, eventData: any): string {
    if (!message) return '';
    
    return message.replace(/\{([^}]+)\}/g, (match, field) => {
      const value = this.getNestedValue(eventData, field);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Obtener valor anidado de un objeto
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Actualizar estadísticas del trigger
   */
  private async updateTriggerStats(triggerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_triggers')
        .update({
          trigger_count: supabase.sql`trigger_count + 1`,
          last_triggered: new Date().toISOString()
        })
        .eq('id', triggerId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating trigger stats:', error);
    }
  }

  // =====================================================
  // LOGGING Y MONITOREO
  // =====================================================

  /**
   * Log de acciones de trigger
   */
  private async logTriggerAction(
    automationType: string,
    automationId: string,
    action: string,
    status: 'success' | 'error' | 'warning' | 'info',
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('automation_logs')
        .insert({
          automation_type: automationType,
          automation_id: automationId,
          action,
          status,
          message,
          details: details || {},
          execution_time_ms: 0
        });

      if (error) console.error('Error logging trigger action:', error);
    } catch (error) {
      console.error('Error logging trigger action:', error);
    }
  }

  /**
   * Obtener logs de triggers
   */
  async getTriggerLogs(triggerId?: string, limit: number = 100): Promise<any[]> {
    try {
      let query = supabase
        .from('automation_logs')
        .select('*')
        .eq('automation_type', 'trigger')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (triggerId) {
        query = query.eq('automation_id', triggerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting trigger logs:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de triggers
   */
  async getTriggerStats(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('system_triggers')
        .select('is_active, trigger_count')
        .eq('is_active', true);

      if (error) throw error;

      const stats = {
        total_triggers: data?.length || 0,
        total_executions: data?.reduce((sum, trigger) => sum + (trigger.trigger_count || 0), 0) || 0,
        average_executions: data?.length > 0 ? 
          data.reduce((sum, trigger) => sum + (trigger.trigger_count || 0), 0) / data.length : 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting trigger stats:', error);
      return {
        total_triggers: 0,
        total_executions: 0,
        average_executions: 0
      };
    }
  }
}

// Instancia singleton del servicio
export const triggerService = new TriggerService();
