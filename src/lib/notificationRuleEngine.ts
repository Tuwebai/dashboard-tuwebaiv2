import { supabase } from './supabase';
import { notificationService } from './notificationService';
import { notificationTemplateService } from './notificationTemplateService';
import { notificationChannelService } from './notificationChannelService';

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

export interface NotificationRule {
  id: string;
  name: string;
  description?: string;
  triggerEvent: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  type: 'send_notification' | 'send_email' | 'send_push' | 'send_webhook' | 'update_field' | 'create_task' | 'escalate';
  config: Record<string, any>;
  channels?: string[];
  template?: string;
  recipients?: string[] | 'user' | 'admin' | 'all';
  delay?: number; // en segundos
  retryCount?: number;
}

export interface EventContext {
  event: string;
  entity: string;
  entityId: string;
  userId?: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  conditionsMet: boolean;
  actionsExecuted: boolean;
  errors?: string[];
  executionTime: number;
}

export interface RuleExecutionLog {
  id: string;
  ruleId: string;
  eventContext: EventContext;
  result: RuleEvaluationResult;
  executedAt: string;
}

// =====================================================
// OPERADORES DE CONDICIÓN
// =====================================================

const conditionOperators = {
  equals: (fieldValue: any, conditionValue: any) => fieldValue === conditionValue,
  not_equals: (fieldValue: any, conditionValue: any) => fieldValue !== conditionValue,
  contains: (fieldValue: any, conditionValue: any) => {
    if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
      return fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
    }
    if (Array.isArray(fieldValue)) {
      return fieldValue.some(item => 
        typeof item === 'string' && item.toLowerCase().includes(conditionValue.toLowerCase())
      );
    }
    return false;
  },
  not_contains: (fieldValue: any, conditionValue: any) => !conditionOperators.contains(fieldValue, conditionValue),
  greater_than: (fieldValue: any, conditionValue: any) => {
    const num1 = parseFloat(fieldValue);
    const num2 = parseFloat(conditionValue);
    return !isNaN(num1) && !isNaN(num2) && num1 > num2;
  },
  less_than: (fieldValue: any, conditionValue: any) => {
    const num1 = parseFloat(fieldValue);
    const num2 = parseFloat(conditionValue);
    return !isNaN(num1) && !isNaN(num2) && num1 < num2;
  },
  in: (fieldValue: any, conditionValue: any) => {
    if (Array.isArray(conditionValue)) {
      return conditionValue.includes(fieldValue);
    }
    return false;
  },
  not_in: (fieldValue: any, conditionValue: any) => !conditionOperators.in(fieldValue, conditionValue),
  exists: (fieldValue: any) => fieldValue !== undefined && fieldValue !== null && fieldValue !== '',
  not_exists: (fieldValue: any) => !conditionOperators.exists(fieldValue)
};

// =====================================================
// MOTOR DE REGLAS DE NOTIFICACIÓN
// =====================================================

export class NotificationRuleEngine {
  private rules: Map<string, NotificationRule> = new Map();
  private executionLogs: RuleExecutionLog[] = [];
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  // =====================================================
  // INICIALIZACIÓN
  // =====================================================

  private async initialize(): Promise<void> {
    try {
      await this.loadRules();
      this.isInitialized = true;

    } catch (error) {
      console.error('❌ Error inicializando NotificationRuleEngine:', error);
    }
  }

  private async loadRules(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      this.rules.clear();
      (data || []).forEach(rule => {
        this.rules.set(rule.id, this.mapDatabaseRule(rule));
      });


    } catch (error) {
      console.error('Error loading notification rules:', error);
      throw error;
    }
  }

  // =====================================================
  // EVALUACIÓN DE REGLAS
  // =====================================================

  async evaluateRules(eventContext: EventContext): Promise<RuleEvaluationResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const results: RuleEvaluationResult[] = [];
    const matchingRules = this.getMatchingRules(eventContext.event);



    for (const rule of matchingRules) {
      try {
        const ruleStartTime = Date.now();
        const result = await this.evaluateRule(rule, eventContext);
        result.executionTime = Date.now() - ruleStartTime;
        results.push(result);

        // Log de ejecución
        await this.logRuleExecution(rule.id, eventContext, result);
      } catch (error) {
        console.error(`Error evaluating rule ${rule.name}:`, error);
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          matched: false,
          conditionsMet: false,
          actionsExecuted: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          executionTime: 0
        });
      }
    }

    const totalTime = Date.now() - startTime;


    return results;
  }

  private getMatchingRules(event: string): NotificationRule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.triggerEvent === event)
      .sort((a, b) => b.priority - a.priority);
  }

  private async evaluateRule(rule: NotificationRule, context: EventContext): Promise<RuleEvaluationResult> {
    const result: RuleEvaluationResult = {
      ruleId: rule.id,
      ruleName: rule.name,
      matched: false,
      conditionsMet: false,
      actionsExecuted: false,
      errors: [],
      executionTime: 0
    };

    try {
      // 1. Evaluar condiciones
      result.conditionsMet = this.evaluateConditions(rule.conditions, context);
      
      if (!result.conditionsMet) {
        return result;
      }

      result.matched = true;

      // 2. Ejecutar acciones
      result.actionsExecuted = await this.executeActions(rule.actions, context);

      return result;
    } catch (error) {
      result.errors = result.errors || [];
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  // =====================================================
  // EVALUACIÓN DE CONDICIONES
  // =====================================================

  private evaluateConditions(conditions: RuleCondition[], context: EventContext): boolean {
    if (!conditions || conditions.length === 0) {
      return true; // Sin condiciones = siempre verdadero
    }

    let result = true;
    let logicalOperator: 'AND' | 'OR' = 'AND';

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, context);

      if (i === 0) {
        result = conditionResult;
      } else {
        if (logicalOperator === 'AND') {
          result = result && conditionResult;
        } else {
          result = result || conditionResult;
        }
      }

      logicalOperator = condition.logicalOperator || 'AND';
    }

    return result;
  }

  private evaluateCondition(condition: RuleCondition, context: EventContext): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    const operator = conditionOperators[condition.operator];

    if (!operator) {
      console.warn(`Operador desconocido: ${condition.operator}`);
      return false;
    }

    try {
      return operator(fieldValue, condition.value);
    } catch (error) {
      console.error(`Error evaluating condition ${condition.field} ${condition.operator} ${condition.value}:`, error);
      return false;
    }
  }

  private getFieldValue(field: string, context: EventContext): any {
    const fieldParts = field.split('.');
    let value: any = context;

    for (const part of fieldParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  // =====================================================
  // EJECUCIÓN DE ACCIONES
  // =====================================================

  private async executeActions(actions: RuleAction[], context: EventContext): Promise<boolean> {
    if (!actions || actions.length === 0) {
      return true;
    }

    const results = await Promise.allSettled(
      actions.map(action => this.executeAction(action, context))
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const totalCount = results.length;



    return successCount > 0;
  }

  private async executeAction(action: RuleAction, context: EventContext): Promise<boolean> {
    try {
      switch (action.type) {
        case 'send_notification':
          return await this.executeSendNotification(action, context);
        
        case 'send_email':
          return await this.executeSendEmail(action, context);
        
        case 'send_push':
          return await this.executeSendPush(action, context);
        
        case 'send_webhook':
          return await this.executeSendWebhook(action, context);
        
        case 'update_field':
          return await this.executeUpdateField(action, context);
        
        case 'create_task':
          return await this.executeCreateTask(action, context);
        
        case 'escalate':
          return await this.executeEscalate(action, context);
        
        default:
          console.warn(`Tipo de acción desconocido: ${action.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      return false;
    }
  }

  private async executeSendNotification(action: RuleAction, context: EventContext): Promise<boolean> {
    try {
      const templateName = action.config.template || 'default';
      const variables = this.buildTemplateVariables(action, context);
      const channels = action.channels || ['in_app'];

      // Renderizar plantilla
      const renderedTemplate = await notificationTemplateService.renderTemplate(
        templateName,
        variables,
        channels[0]
      );

      // Determinar destinatarios
      const recipients = await this.getRecipients(action.recipients, context);

      // Enviar notificaciones
      for (const recipient of recipients) {
        const notification = await notificationService.createNotification({
          user_id: recipient.id,
          title: renderedTemplate.subject || 'Notificación del Sistema',
          message: renderedTemplate.content,
          type: 'info',
          category: 'system',
          action_url: action.config.actionUrl,
          metadata: {
            ruleId: context.entityId,
            event: context.event,
            template: templateName,
            variables
          }
        });

        // Enviar por canales adicionales si se especifican
        if (channels.length > 1) {
          await notificationChannelService.sendToChannels(
            notification,
            recipient,
            channels.filter(c => c !== 'in_app')
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  private async executeSendEmail(action: RuleAction, context: EventContext): Promise<boolean> {
    try {
      const templateName = action.config.template || 'default';
      const variables = this.buildTemplateVariables(action, context);
      const recipients = await this.getRecipients(action.recipients, context);

      for (const recipient of recipients) {
        const renderedTemplate = await notificationTemplateService.renderTemplate(
          templateName,
          variables,
          'email'
        );

        // Aquí se integraría con el servicio de email existente

      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  private async executeSendPush(action: RuleAction, context: EventContext): Promise<boolean> {
    try {
      const templateName = action.config.template || 'default';
      const variables = this.buildTemplateVariables(action, context);
      const recipients = await this.getRecipients(action.recipients, context);

      for (const recipient of recipients) {
        const renderedTemplate = await notificationTemplateService.renderTemplate(
          templateName,
          variables,
          'push'
        );

        // Enviar push notification
        await notificationChannelService.sendToChannels(
          { title: renderedTemplate.subject || 'Notificación', message: renderedTemplate.content },
          recipient,
          ['push']
        );
      }

      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  private async executeSendWebhook(action: RuleAction, context: EventContext): Promise<boolean> {
    try {
      const webhookUrl = action.config.webhookUrl;
      if (!webhookUrl) {
        throw new Error('Webhook URL not configured');
      }

      const payload = {
        event: context.event,
        entity: context.entity,
        entityId: context.entityId,
        data: context.data,
        metadata: context.metadata,
        timestamp: context.timestamp,
        rule: {
          id: context.entityId,
          name: action.config.ruleName || 'Unknown'
        }
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': action.config.authHeader || '',
          'X-Webhook-Signature': this.generateWebhookSignature(payload, action.config.secretKey || '')
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error sending webhook:', error);
      return false;
    }
  }

  private async executeUpdateField(action: RuleAction, context: EventContext): Promise<boolean> {
    try {
      const { table, field, value, where } = action.config;
      
      if (!table || !field || !where) {
        throw new Error('Missing required config for update_field action');
      }

      const { error } = await supabase
        .from(table)
        .update({ [field]: value })
        .match(where);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating field:', error);
      return false;
    }
  }

  private async executeCreateTask(action: RuleAction, context: EventContext): Promise<boolean> {
    try {
      const { title, description, assignee, priority, dueDate } = action.config;
      
      // Aquí se integraría con el sistema de tareas

      
      return true;
    } catch (error) {
      console.error('Error creating task:', error);
      return false;
    }
  }

  private async executeEscalate(action: RuleAction, context: EventContext): Promise<boolean> {
    try {
      const { escalationLevel, assignee, message } = action.config;
      
      // Aquí se implementaría la lógica de escalación

      
      return true;
    } catch (error) {
      console.error('Error escalating:', error);
      return false;
    }
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  private async getRecipients(recipients: string[] | 'user' | 'admin' | 'all' | undefined, context: EventContext): Promise<any[]> {
    if (!recipients || recipients === 'user') {
      // Usuario del contexto
      if (context.userId) {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', context.userId)
          .single();
        return user ? [user] : [];
      }
      return [];
    }

    if (recipients === 'admin') {
      // Todos los administradores
      const { data: admins } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin');
      return admins || [];
    }

    if (recipients === 'all') {
      // Todos los usuarios
      const { data: users } = await supabase
        .from('users')
        .select('*');
      return users || [];
    }

    if (Array.isArray(recipients)) {
      // Usuarios específicos por ID
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .in('id', recipients);
      return users || [];
    }

    return [];
  }

  private buildTemplateVariables(action: RuleAction, context: EventContext): Record<string, any> {
    const variables: Record<string, any> = {
      event: context.event,
      entity: context.entity,
      entityId: context.entityId,
      timestamp: context.timestamp,
      ...context.data,
      ...context.metadata
    };

    // Agregar variables personalizadas de la acción
    if (action.config.variables) {
      Object.assign(variables, action.config.variables);
    }

    return variables;
  }

  private generateWebhookSignature(payload: any, secretKey: string): string {
    // Implementar generación de firma HMAC
    return btoa(JSON.stringify(payload) + secretKey);
  }

  private async logRuleExecution(ruleId: string, eventContext: EventContext, result: RuleEvaluationResult): Promise<void> {
    try {
      const log: RuleExecutionLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ruleId,
        eventContext,
        result,
        executedAt: new Date().toISOString()
      };

      this.executionLogs.push(log);

      // Mantener solo los últimos 1000 logs
      if (this.executionLogs.length > 1000) {
        this.executionLogs = this.executionLogs.slice(-1000);
      }

      // Opcional: Guardar en base de datos
      // await supabase.from('rule_execution_logs').insert(log);
    } catch (error) {
      console.error('Error logging rule execution:', error);
    }
  }

  private mapDatabaseRule(data: any): NotificationRule {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      triggerEvent: data.trigger_event,
      conditions: data.conditions || [],
      actions: data.actions || [],
      isActive: data.is_active,
      priority: data.priority || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // =====================================================
  // MÉTODOS PÚBLICOS
  // =====================================================

  async refreshRules(): Promise<void> {
    await this.loadRules();
  }

  getRules(): NotificationRule[] {
    return Array.from(this.rules.values());
  }

  getRuleById(id: string): NotificationRule | undefined {
    return this.rules.get(id);
  }

  getExecutionLogs(): RuleExecutionLog[] {
    return [...this.executionLogs];
  }

  async createRule(rule: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationRule> {
    try {
      const { data, error } = await supabase
        .from('notification_rules')
        .insert([{
          name: rule.name,
          description: rule.description,
          trigger_event: rule.triggerEvent,
          conditions: rule.conditions,
          actions: rule.actions,
          is_active: rule.isActive,
          priority: rule.priority
        }])
        .select()
        .single();

      if (error) throw error;

      const newRule = this.mapDatabaseRule(data);
      this.rules.set(newRule.id, newRule);

      return newRule;
    } catch (error) {
      console.error('Error creating rule:', error);
      throw error;
    }
  }

  async updateRule(id: string, updates: Partial<NotificationRule>): Promise<NotificationRule> {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.triggerEvent !== undefined) updateData.trigger_event = updates.triggerEvent;
      if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
      if (updates.actions !== undefined) updateData.actions = updates.actions;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('notification_rules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedRule = this.mapDatabaseRule(data);
      this.rules.set(updatedRule.id, updatedRule);

      return updatedRule;
    } catch (error) {
      console.error('Error updating rule:', error);
      throw error;
    }
  }

  async deleteRule(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.rules.delete(id);
    } catch (error) {
      console.error('Error deleting rule:', error);
      throw error;
    }
  }
}

// Instancia global del motor de reglas
export const notificationRuleEngine = new NotificationRuleEngine();
export default notificationRuleEngine;
