

import { supabase } from './supabase';

export interface TicketWorkflow {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  stages: WorkflowStage[];
  autoAssignment: AutoAssignmentRule[];
  escalationRules: EscalationRule[];
  slaRules: SLARule[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  order: number;
  color: string;
  actions: StageAction[];
  conditions: StageCondition[];
  autoTransition: AutoTransitionRule[];
}

export interface StageAction {
  id: string;
  name: string;
  type: 'button' | 'automatic' | 'conditional';
  action: 'assign' | 'escalate' | 'notify' | 'update' | 'close' | 'custom';
  parameters: Record<string, any>;
  conditions?: ActionCondition[];
}

export interface StageCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface AutoTransitionRule {
  id: string;
  condition: StageCondition;
  targetStage: string;
  delay?: number; // en minutos
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AutoAssignmentRule {
  id: string;
  name: string;
  conditions: AssignmentCondition[];
  assignmentType: 'round_robin' | 'least_busy' | 'expertise' | 'specific_user' | 'team';
  targetUsers?: string[];
  targetTeam?: string;
  priority: number;
  isActive: boolean;
}

export interface AssignmentCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface EscalationRule {
  id: string;
  name: string;
  trigger: 'time' | 'priority' | 'stage' | 'custom';
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  delay: number; // en minutos
  priority: number;
  isActive: boolean;
}

export interface EscalationCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  timeField?: string; // para condiciones de tiempo
}

export interface EscalationAction {
  id: string;
  type: 'notify' | 'assign' | 'update_stage' | 'update_priority' | 'create_task' | 'send_email';
  parameters: Record<string, any>;
}

export interface SLARule {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  responseTime: number; // en minutos
  resolutionTime: number; // en minutos
  businessHours: BusinessHours;
  exceptions: SLAException[];
}

export interface BusinessHours {
  monday: { start: string; end: string; enabled: boolean };
  tuesday: { start: string; end: string; enabled: boolean };
  wednesday: { start: string; end: string; enabled: boolean };
  thursday: { start: string; end: string; enabled: boolean };
  friday: { start: string; end: string; enabled: boolean };
  saturday: { start: string; end: string; enabled: boolean };
  sunday: { start: string; end: string; enabled: boolean };
  timezone: string;
}

export interface SLAException {
  id: string;
  name: string;
  type: 'holiday' | 'maintenance' | 'custom';
  startDate: string;
  endDate: string;
  description: string;
}

// Workflows predefinidos
export const DEFAULT_WORKFLOWS: TicketWorkflow[] = [
  {
    id: 'general-support',
    name: 'Soporte General',
    description: 'Workflow estándar para tickets de soporte general',
    isDefault: true,
    isActive: true,
    stages: [
      {
        id: 'new',
        name: 'Nuevo',
        description: 'Ticket recién creado',
        order: 1,
        color: '#3b82f6',
        actions: [
          {
            id: 'auto-assign',
            name: 'Asignación Automática',
            type: 'automatic',
            action: 'assign',
            parameters: { method: 'round_robin' }
          }
        ],
        conditions: [],
        autoTransition: []
      },
      {
        id: 'in-progress',
        name: 'En Progreso',
        description: 'Ticket siendo atendido',
        order: 2,
        color: '#f59e0b',
        actions: [
          {
            id: 'update-status',
            name: 'Actualizar Estado',
            type: 'button',
            action: 'update',
            parameters: { field: 'status', value: 'in_progress' }
          },
          {
            id: 'escalate',
            name: 'Escalar',
            type: 'button',
            action: 'escalate',
            parameters: { reason: 'complex_issue' }
          }
        ],
        conditions: [],
        autoTransition: [
          {
            id: 'timeout-escalation',
            condition: {
              id: 'time-condition',
              field: 'time_in_stage',
              operator: 'greater_than',
              value: 60 // 60 minutos
            },
            targetStage: 'escalated',
            delay: 60,
            priority: 'high'
          }
        ]
      },
      {
        id: 'waiting',
        name: 'En Espera',
        description: 'Esperando respuesta del cliente',
        order: 3,
        color: '#8b5cf6',
        actions: [
          {
            id: 'resume',
            name: 'Reanudar',
            type: 'button',
            action: 'update',
            parameters: { field: 'status', value: 'in_progress' }
          }
        ],
        conditions: [],
        autoTransition: [
          {
            id: 'auto-resume',
            condition: {
              id: 'response-received',
              field: 'client_response',
              operator: 'equals',
              value: true
            },
            targetStage: 'in-progress',
            priority: 'medium'
          }
        ]
      },
      {
        id: 'escalated',
        name: 'Escalado',
        description: 'Ticket escalado a nivel superior',
        order: 4,
        color: '#ef4444',
        actions: [
          {
            id: 'assign-senior',
            name: 'Asignar Senior',
            type: 'automatic',
            action: 'assign',
            parameters: { method: 'expertise', level: 'senior' }
          }
        ],
        conditions: [],
        autoTransition: []
      },
      {
        id: 'resolved',
        name: 'Resuelto',
        description: 'Ticket resuelto',
        order: 5,
        color: '#10b981',
        actions: [
          {
            id: 'close',
            name: 'Cerrar',
            type: 'button',
            action: 'close',
            parameters: {}
          },
          {
            id: 'reopen',
            name: 'Reabrir',
            type: 'button',
            action: 'update',
            parameters: { field: 'status', value: 'in_progress' }
          }
        ],
        conditions: [],
        autoTransition: [
          {
            id: 'auto-close',
            condition: {
              id: 'client-satisfaction',
              field: 'client_satisfaction',
              operator: 'equals',
              value: 'satisfied'
            },
            targetStage: 'closed',
            delay: 24 * 60, // 24 horas
            priority: 'low'
          }
        ]
      },
      {
        id: 'closed',
        name: 'Cerrado',
        description: 'Ticket cerrado definitivamente',
        order: 6,
        color: '#6b7280',
        actions: [
          {
            id: 'reopen',
            name: 'Reabrir',
            type: 'button',
            action: 'update',
            parameters: { field: 'status', value: 'new' }
          }
        ],
        conditions: [],
        autoTransition: []
      }
    ],
    autoAssignment: [
      {
        id: 'general-assignment',
        name: 'Asignación General',
        conditions: [
          {
            id: 'priority-low',
            field: 'priority',
            operator: 'equals',
            value: 'low'
          }
        ],
        assignmentType: 'round_robin',
        priority: 1,
        isActive: true
      },
      {
        id: 'urgent-assignment',
        name: 'Asignación Urgente',
        conditions: [
          {
            id: 'priority-high',
            field: 'priority',
            operator: 'in',
            value: ['high', 'critical']
          }
        ],
        assignmentType: 'least_busy',
        priority: 2,
        isActive: true
      }
    ],
    escalationRules: [
      {
        id: 'time-escalation',
        name: 'Escalación por Tiempo',
        trigger: 'time',
        conditions: [
          {
            id: 'time-exceeded',
            field: 'time_in_stage',
            operator: 'greater_than',
            value: 120 // 2 horas
          }
        ],
        actions: [
          {
            id: 'notify-manager',
            type: 'notify',
            parameters: { recipients: ['managers'], message: 'Ticket escalado por tiempo' }
          },
          {
            id: 'update-priority',
            type: 'update_priority',
            parameters: { newPriority: 'high' }
          }
        ],
        delay: 120,
        priority: 1,
        isActive: true
      }
    ],
    slaRules: [
      {
        id: 'low-priority-sla',
        name: 'SLA Prioridad Baja',
        priority: 'low',
        responseTime: 240, // 4 horas
        resolutionTime: 1440, // 24 horas
        businessHours: {
          monday: { start: '09:00', end: '18:00', enabled: true },
          tuesday: { start: '09:00', end: '18:00', enabled: true },
          wednesday: { start: '09:00', end: '18:00', enabled: true },
          thursday: { start: '09:00', end: '18:00', enabled: true },
          friday: { start: '09:00', end: '18:00', enabled: true },
          saturday: { start: '10:00', end: '14:00', enabled: true },
          sunday: { start: '00:00', end: '00:00', enabled: false },
          timezone: 'America/New_York'
        },
        exceptions: []
      },
      {
        id: 'high-priority-sla',
        name: 'SLA Prioridad Alta',
        priority: 'high',
        responseTime: 60, // 1 hora
        resolutionTime: 480, // 8 horas
        businessHours: {
          monday: { start: '09:00', end: '18:00', enabled: true },
          tuesday: { start: '09:00', end: '18:00', enabled: true },
          wednesday: { start: '09:00', end: '18:00', enabled: true },
          thursday: { start: '09:00', end: '18:00', enabled: true },
          friday: { start: '09:00', end: '18:00', enabled: true },
          saturday: { start: '10:00', end: '14:00', enabled: true },
          sunday: { start: '00:00', end: '00:00', enabled: false },
          timezone: 'America/New_York'
        },
        exceptions: []
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class TicketWorkflowService {
  private workflows: TicketWorkflow[] = [];

  constructor() {
    this.initializeWorkflows();
  }

  private async initializeWorkflows() {
    try {
      const { data: workflowsData, error } = await supabase
        .from('ticket_workflows')
        .select('*');
      
      if (error) throw error;
      
      if (!workflowsData || workflowsData.length === 0) {
        // Crear workflows por defecto
        const { data: insertedWorkflows, error: insertError } = await supabase
          .from('ticket_workflows')
          .insert(DEFAULT_WORKFLOWS)
          .select();
        
        if (insertError) throw insertError;
        this.workflows = insertedWorkflows || DEFAULT_WORKFLOWS;
      } else {
        this.workflows = workflowsData as TicketWorkflow[];
      }
    } catch (error) {
      console.error('Error initializing workflows:', error);
      this.workflows = DEFAULT_WORKFLOWS;
    }
  }

  // Gestión de Workflows
  public async getWorkflows(): Promise<TicketWorkflow[]> {
    try {
      const { data, error } = await supabase
        .from('ticket_workflows')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting workflows:', error);
      return [];
    }
  }

  public async createWorkflow(workflow: Omit<TicketWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const workflowData = {
        ...workflow,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('ticket_workflows')
        .insert(workflowData)
        .select()
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw new Error('No se pudo crear el workflow');
    }
  }

  public async updateWorkflow(workflowId: string, updates: Partial<TicketWorkflow>): Promise<void> {
    try {
      const { error } = await supabase
        .from('ticket_workflows')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', workflowId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw new Error('No se pudo actualizar el workflow');
    }
  }

  public async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ticket_workflows')
        .delete()
        .eq('id', workflowId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw new Error('No se pudo eliminar el workflow');
    }
  }

  // Lógica de Asignación Automática
  public async autoAssignTicket(ticketData: any): Promise<string | null> {
    try {
      const workflows = await this.getWorkflows();
      const activeWorkflow = workflows.find(w => w.isActive && w.isDefault) || workflows[0];
      
      if (!activeWorkflow) return null;

      for (const rule of activeWorkflow.autoAssignment) {
        if (!rule.isActive) continue;

        const matches = rule.conditions.every(condition => {
          return this.evaluateCondition(ticketData, condition);
        });

        if (matches) {
          return await this.executeAssignment(rule, ticketData);
        }
      }

      return null;
    } catch (error) {
      console.error('Error in auto assignment:', error);
      return null;
    }
  }

  // Lógica de Escalación
  public async checkEscalation(ticketData: any): Promise<void> {
    try {
      const workflows = await this.getWorkflows();
      const activeWorkflow = workflows.find(w => w.isActive && w.isDefault) || workflows[0];
      
      if (!activeWorkflow) return;

      for (const rule of activeWorkflow.escalationRules) {
        if (!rule.isActive) continue;

        const shouldEscalate = rule.conditions.every(condition => {
          return this.evaluateCondition(ticketData, condition);
        });

        if (shouldEscalate) {
          await this.executeEscalation(rule, ticketData);
        }
      }
    } catch (error) {
      console.error('Error checking escalation:', error);
    }
  }

  // Lógica de Transiciones Automáticas
  public async checkAutoTransitions(ticketData: any): Promise<void> {
    try {
      const workflows = await this.getWorkflows();
      const activeWorkflow = workflows.find(w => w.isActive && w.isDefault) || workflows[0];
      
      if (!activeWorkflow) return;

      const currentStage = activeWorkflow.stages.find(s => s.id === ticketData.stage);
      if (!currentStage) return;

      for (const transition of currentStage.autoTransition) {
        const shouldTransition = this.evaluateCondition(ticketData, transition.condition);
        
        if (shouldTransition) {
          await this.executeTransition(ticketData, transition);
        }
      }
    } catch (error) {
      console.error('Error checking auto transitions:', error);
    }
  }

  // Verificación de SLA
  public async checkSLA(ticketData: any): Promise<any> {
    try {
      const workflows = await this.getWorkflows();
      const activeWorkflow = workflows.find(w => w.isActive && w.isDefault) || workflows[0];
      
      if (!activeWorkflow) return null;

      const slaRule = activeWorkflow.slaRules.find(rule => rule.priority === ticketData.priority);
      if (!slaRule) return null;

      const now = new Date();
      const ticketCreated = new Date(ticketData.createdAt);
      const timeDiff = now.getTime() - ticketCreated.getTime();
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));

      const isWithinBusinessHours = this.isWithinBusinessHours(slaRule.businessHours, now);
      
      return {
        slaRule,
        responseTime: slaRule.responseTime,
        resolutionTime: slaRule.resolutionTime,
        timeElapsed: minutesDiff,
        isWithinBusinessHours,
        isOverdue: isWithinBusinessHours && minutesDiff > slaRule.responseTime
      };
    } catch (error) {
      console.error('Error checking SLA:', error);
      return null;
    }
  }

  // Utilidades
  private evaluateCondition(data: any, condition: StageCondition | AssignmentCondition | EscalationCondition): boolean {
    const value = data[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      default:
        return false;
    }
  }

  private async executeAssignment(rule: AutoAssignmentRule, ticketData: any): Promise<string | null> {
    // Implementar lógica de asignación según el tipo
    switch (rule.assignmentType) {
      case 'round_robin':
        return await this.roundRobinAssignment(rule.targetUsers);
      case 'least_busy':
        return await this.leastBusyAssignment(rule.targetUsers);
      case 'expertise':
        return await this.expertiseAssignment(ticketData.category);
      case 'specific_user':
        return rule.targetUsers?.[0] || null;
      case 'team':
        return await this.teamAssignment(rule.targetTeam);
      default:
        return null;
    }
  }

  private async executeEscalation(rule: EscalationRule, ticketData: any): Promise<void> {
    for (const action of rule.actions) {
      switch (action.type) {
        case 'notify':
          // Implementar notificación
          break;
        case 'assign':
          // Implementar reasignación
          break;
        case 'update_stage':
          // Implementar cambio de etapa
          break;
        case 'update_priority':
          // Implementar cambio de prioridad
          break;
        case 'create_task':
          // Implementar creación de tarea
          break;
        case 'send_email':
          // Implementar envío de email
          break;
      }
    }
  }

  private async executeTransition(ticketData: any, transition: AutoTransitionRule): Promise<void> {
    // Implementar transición automática

  }

  private isWithinBusinessHours(businessHours: BusinessHours, date: Date): boolean {
    const dayOfWeek = date.getDay();
    const time = date.toTimeString().slice(0, 5);
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];
    const dayConfig = businessHours[dayName as keyof BusinessHours];
    
    if (!dayConfig.enabled) return false;
    
    return time >= dayConfig.start && time <= dayConfig.end;
  }

  // Métodos de asignación específicos
  private async roundRobinAssignment(users?: string[]): Promise<string | null> {
    // Implementar asignación round robin
    return users?.[0] || null;
  }

  private async leastBusyAssignment(users?: string[]): Promise<string | null> {
    // Implementar asignación por carga de trabajo
    return users?.[0] || null;
  }

  private async expertiseAssignment(category: string): Promise<string | null> {
    // Implementar asignación por expertise
    return null;
  }

  private async teamAssignment(teamId?: string): Promise<string | null> {
    // Implementar asignación por equipo
    return null;
  }

  // Suscripciones en tiempo real
  public subscribeToWorkflows(callback: (workflows: TicketWorkflow[]) => void): () => void {
    const subscription = supabase
      .channel('ticket_workflows_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ticket_workflows' },
        (payload) => {
          // Recargar todos los workflows cuando hay cambios
          this.getWorkflows().then(callback);
        }
      )
      .subscribe();
    
    // Retornar función para cancelar suscripción
    return () => {
      subscription.unsubscribe();
    };
  }
}

// Singleton instance
export const ticketWorkflowService = new TicketWorkflowService();

export default ticketWorkflowService; 
