

import { supabase } from './supabase';

export interface TicketAssignment {
  id: string;
  ticketId: string;
  assignedTo: string;
  assignedBy: string;
  assignmentType: 'manual' | 'auto' | 'escalation' | 'round_robin' | 'least_busy' | 'expertise';
  reason: string;
  assignedAt: string;
  estimatedResolutionTime?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgentWorkload {
  userId: string;
  email: string;
  displayName: string;
  activeTickets: number;
  totalTickets: number;
  averageResolutionTime: number;
  expertise: string[];
  availability: 'available' | 'busy' | 'offline';
  lastActivity: string;
  rating: number;
}

export interface AssignmentRule {
  id: string;
  name: string;
  type: 'round_robin' | 'least_busy' | 'expertise' | 'specific_user' | 'team';
  conditions: AssignmentCondition[];
  priority: number;
  isActive: boolean;
  targetUsers?: string[];
  targetTeam?: string;
  expertise?: string[];
  maxWorkload?: number;
}

export interface AssignmentCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface TicketData {
  id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  subcategory?: string;
  clientId: string;
  clientEmail: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  stage: string;
  tags: string[];
  estimatedTime?: number;
  complexity?: 'simple' | 'medium' | 'complex';
  language?: string;
  timezone?: string;
}

class TicketAssignmentService {
  private assignmentRules: AssignmentRule[] = [];
  private agentWorkloads: Map<string, AgentWorkload> = new Map();

  constructor() {
    this.loadAssignmentRules();
    this.loadAgentWorkloads();
  }

  // Cargar reglas de asignación
  private async loadAssignmentRules() {
    try {
      const { data, error } = await supabase
        .from('assignment_rules')
        .select('*');
      
      if (error) throw error;
      this.assignmentRules = data || [];
    } catch (error) {
      console.error('Error loading assignment rules:', error);
    }
  }

  // Cargar cargas de trabajo de agentes
  private async loadAgentWorkloads() {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      
      for (const user of users || []) {
        if (user.role === 'support' || user.role === 'admin') {
          const workload = await this.calculateAgentWorkload(user.id);
          this.agentWorkloads.set(user.id, workload);
        }
      }
    } catch (error) {
      console.error('Error loading agent workloads:', error);
    }
  }

  // Calcular carga de trabajo de un agente
  private async calculateAgentWorkload(userId: string): Promise<AgentWorkload> {
    try {
      // Obtener tickets activos del agente
      const { data: activeTicketsData, error: activeError } = await supabase
        .from('tickets')
        .select('*')
        .eq('assignedTo', userId)
        .in('status', ['new', 'in_progress', 'waiting']);
      
      if (activeError) throw activeError;
      const activeTickets = activeTicketsData?.length || 0;

      // Obtener todos los tickets del agente
      const { data: allTicketsData, error: allError } = await supabase
        .from('tickets')
        .select('*')
        .eq('assignedTo', userId);
      
      if (allError) throw allError;
      const totalTickets = allTicketsData?.length || 0;

      // Calcular tiempo promedio de resolución
      let totalResolutionTime = 0;
      let resolvedTickets = 0;
      
      allTicketsData?.forEach(ticket => {
        if (ticket.status === 'resolved' && ticket.resolvedAt && ticket.assignedAt) {
          const resolutionTime = new Date(ticket.resolvedAt).getTime() - new Date(ticket.assignedAt).getTime();
          totalResolutionTime += resolutionTime;
          resolvedTickets++;
        }
      });

      const averageResolutionTime = resolvedTickets > 0 ? totalResolutionTime / resolvedTickets : 0;

      // Obtener información del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;

      return {
        userId,
        email: userData?.email || '',
        displayName: userData?.displayName || '',
        activeTickets,
        totalTickets,
        averageResolutionTime,
        expertise: userData?.expertise || [],
        availability: this.determineAvailability(userData),
        lastActivity: userData?.lastActivity || new Date().toISOString(),
        rating: userData?.rating || 0
      };
    } catch (error) {
      console.error('Error calculating agent workload:', error);
      return {
        userId,
        email: '',
        displayName: '',
        activeTickets: 0,
        totalTickets: 0,
        averageResolutionTime: 0,
        expertise: [],
        availability: 'offline',
        lastActivity: new Date().toISOString(),
        rating: 0
      };
    }
  }

  // Determinar disponibilidad del agente
  private determineAvailability(userData: any): 'available' | 'busy' | 'offline' {
    if (!userData?.lastActivity) return 'offline';
    
    const lastActivity = new Date(userData.lastActivity);
    const now = new Date();
    const timeDiff = now.getTime() - lastActivity.getTime();
    
    // Si no ha tenido actividad en 30 minutos, está offline
    if (timeDiff > 30 * 60 * 1000) return 'offline';
    
    // Si tiene muchos tickets activos, está ocupado
    if (userData.activeTickets > 5) return 'busy';
    
    return 'available';
  }

  // Asignar ticket automáticamente
  public async autoAssignTicket(ticketData: TicketData): Promise<string | null> {
    try {
      // Ordenar reglas por prioridad
      const sortedRules = this.assignmentRules
        .filter(rule => rule.isActive)
        .sort((a, b) => b.priority - a.priority);

      for (const rule of sortedRules) {
        // Verificar si la regla aplica al ticket
        const applies = rule.conditions.every(condition => {
          return this.evaluateCondition(ticketData, condition);
        });

        if (applies) {
          const assignedUserId = await this.executeAssignmentRule(rule, ticketData);
          if (assignedUserId) {
            await this.recordAssignment(ticketData.id, assignedUserId, rule.type);
            return assignedUserId;
          }
        }
      }

      // Si no se aplica ninguna regla, usar asignación por defecto
      return await this.defaultAssignment(ticketData);
    } catch (error) {
      console.error('Error in auto assignment:', error);
      return null;
    }
  }

  // Ejecutar regla de asignación
  private async executeAssignmentRule(rule: AssignmentRule, ticketData: TicketData): Promise<string | null> {
    switch (rule.type) {
      case 'round_robin':
        return await this.roundRobinAssignment(rule.targetUsers);
      case 'least_busy':
        return await this.leastBusyAssignment(rule.targetUsers, rule.maxWorkload);
      case 'expertise':
        return await this.expertiseAssignment(ticketData.category, rule.expertise);
      case 'specific_user':
        return rule.targetUsers?.[0] || null;
      case 'team':
        return await this.teamAssignment(rule.targetTeam);
      default:
        return null;
    }
  }

  // Asignación Round Robin
  private async roundRobinAssignment(targetUsers?: string[]): Promise<string | null> {
    try {
      const availableUsers = targetUsers || Array.from(this.agentWorkloads.keys());
      const availableAgents = availableUsers.filter(userId => {
        const workload = this.agentWorkloads.get(userId);
        return workload && workload.availability !== 'offline';
      });

      if (availableAgents.length === 0) return null;

      // Obtener el último agente asignado
      const { data: lastAssignmentData, error: lastAssignmentError } = await supabase
        .from('ticket_assignments')
        .select('*')
        .order('assignedAt', { ascending: false })
        .limit(1);
      
      if (lastAssignmentError) throw lastAssignmentError;
      
      let nextAgentIndex = 0;
      if (lastAssignmentData && lastAssignmentData.length > 0) {
        const lastAssignment = lastAssignmentData[0];
        const lastAgentIndex = availableAgents.indexOf(lastAssignment.assignedTo);
        nextAgentIndex = (lastAgentIndex + 1) % availableAgents.length;
      }

      return availableAgents[nextAgentIndex];
    } catch (error) {
      console.error('Error in round robin assignment:', error);
      return null;
    }
  }

  // Asignación por menor carga
  private async leastBusyAssignment(targetUsers?: string[], maxWorkload?: number): Promise<string | null> {
    try {
      const availableUsers = targetUsers || Array.from(this.agentWorkloads.keys());
      const availableAgents = availableUsers
        .map(userId => this.agentWorkloads.get(userId))
        .filter(workload => {
          if (!workload || workload.availability === 'offline') return false;
          if (maxWorkload && workload.activeTickets >= maxWorkload) return false;
          return true;
        })
        .sort((a, b) => a!.activeTickets - b!.activeTickets);

      return availableAgents.length > 0 ? availableAgents[0]!.userId : null;
    } catch (error) {
      console.error('Error in least busy assignment:', error);
      return null;
    }
  }

  // Asignación por expertise
  private async expertiseAssignment(category: string, requiredExpertise?: string[]): Promise<string | null> {
    try {
      const expertise = requiredExpertise || [category];
      const availableAgents = Array.from(this.agentWorkloads.values())
        .filter(workload => {
          if (workload.availability === 'offline') return false;
          return expertise.some(exp => workload.expertise.includes(exp));
        })
        .sort((a, b) => {
          // Priorizar por expertise y luego por carga de trabajo
          const aExpertiseMatch = expertise.filter(exp => a.expertise.includes(exp)).length;
          const bExpertiseMatch = expertise.filter(exp => b.expertise.includes(exp)).length;
          
          if (aExpertiseMatch !== bExpertiseMatch) {
            return bExpertiseMatch - aExpertiseMatch;
          }
          
          return a.activeTickets - b.activeTickets;
        });

      return availableAgents.length > 0 ? availableAgents[0].userId : null;
    } catch (error) {
      console.error('Error in expertise assignment:', error);
      return null;
    }
  }

  // Asignación por equipo
  private async teamAssignment(teamId?: string): Promise<string | null> {
    try {
      if (!teamId) return null;

      // Obtener miembros del equipo
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('*')
        .eq('teamId', teamId);
      
      if (teamError) throw teamError;
      const teamMembers = teamData?.map(member => member.userId) || [];

      // Usar asignación por menor carga entre miembros del equipo
      return await this.leastBusyAssignment(teamMembers);
    } catch (error) {
      console.error('Error in team assignment:', error);
      return null;
    }
  }

  // Asignación por defecto
  private async defaultAssignment(ticketData: TicketData): Promise<string | null> {
    try {
      // Usar asignación por menor carga como fallback
      return await this.leastBusyAssignment();
    } catch (error) {
      console.error('Error in default assignment:', error);
      return null;
    }
  }

  // Evaluar condición de asignación
  private evaluateCondition(data: any, condition: AssignmentCondition): boolean {
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

  // Registrar asignación
  private async recordAssignment(ticketId: string, assignedUserId: string, assignmentType: string): Promise<void> {
    try {
      const assignment: Omit<TicketAssignment, 'id'> = {
        ticketId,
        assignedTo: assignedUserId,
        assignedBy: 'system',
        assignmentType: assignmentType as any,
        reason: `Asignación automática por ${assignmentType}`,
        assignedAt: new Date().toISOString(),
        priority: 'medium'
      };

      const { error: assignmentError } = await supabase
        .from('ticket_assignments')
        .insert(assignment);
      
      if (assignmentError) throw assignmentError;

      // Actualizar el ticket
      const { error: ticketUpdateError } = await supabase
        .from('tickets')
        .update({
          assignedTo: assignedUserId,
          assignedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', ticketId);
      
      if (ticketUpdateError) throw ticketUpdateError;

      // Actualizar carga de trabajo del agente
      await this.updateAgentWorkload(assignedUserId);
    } catch (error) {
      console.error('Error recording assignment:', error);
    }
  }

  // Actualizar carga de trabajo del agente
  private async updateAgentWorkload(userId: string): Promise<void> {
    try {
      const workload = await this.calculateAgentWorkload(userId);
      this.agentWorkloads.set(userId, workload);
    } catch (error) {
      console.error('Error updating agent workload:', error);
    }
  }

  // Obtener estadísticas de asignación
  public async getAssignmentStats(): Promise<any> {
    try {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('ticket_assignments')
        .select('*')
        .order('assignedAt', { ascending: false });
      
      if (assignmentsError) throw assignmentsError;

      const stats = {
        totalAssignments: assignments.length,
        byType: {} as Record<string, number>,
        byAgent: {} as Record<string, number>,
        averageResolutionTime: 0,
        agentWorkloads: Array.from(this.agentWorkloads.values())
      };

      assignments.forEach(assignment => {
        stats.byType[assignment.assignmentType] = (stats.byType[assignment.assignmentType] || 0) + 1;
        stats.byAgent[assignment.assignedTo] = (stats.byAgent[assignment.assignedTo] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting assignment stats:', error);
      return null;
    }
  }

  // Reasignar ticket
  public async reassignTicket(ticketId: string, reason: string): Promise<string | null> {
    try {
      // Obtener datos del ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
      
      if (ticketError || !ticketData) return null;

      // Asignar automáticamente
      const newAssignee = await this.autoAssignTicket(ticketData);
      if (newAssignee) {
        await this.recordAssignment(ticketId, newAssignee, 'reassignment');
        return newAssignee;
      }

      return null;
    } catch (error) {
      console.error('Error reassigning ticket:', error);
      return null;
    }
  }

  // Obtener agentes disponibles
  public getAvailableAgents(): AgentWorkload[] {
    return Array.from(this.agentWorkloads.values())
      .filter(agent => agent.availability === 'available')
      .sort((a, b) => a.activeTickets - b.activeTickets);
  }

  // Obtener carga de trabajo de un agente específico
  public getAgentWorkload(userId: string): AgentWorkload | null {
    return this.agentWorkloads.get(userId) || null;
  }
}

// Singleton instance
export const ticketAssignmentService = new TicketAssignmentService();

export default ticketAssignmentService; 
