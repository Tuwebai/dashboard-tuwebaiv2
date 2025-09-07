import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

export interface UserSkill {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency_level: number; // 1-5
  experience_years: number;
  last_used: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignee: string | null;
  assignee_name?: string;
  due_date: string;
  estimated_hours?: number;
  required_skills?: string[];
  project_id: string;
  phase_key?: string;
  created_at: string;
  updated_at?: string;
  table_name?: 'tasks';
}

export interface Report {
  id: string;
  type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  generated_at: string;
  data: {
    total_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    productivity_score: number;
    top_performers: Array<{
      user_id: string;
      name: string;
      tasks_completed: number;
      efficiency_score: number;
    }>;
    critical_issues: Array<{
      task_id: string;
      title: string;
      days_overdue: number;
      assigned_to: string;
    }>;
    skill_gaps: Array<{
      skill_name: string;
      required_count: number;
      available_count: number;
      gap_percentage: number;
    }>;
  };
}

export interface EscalationRule {
  id: string;
  name: string;
  condition: string; // JSON string with conditions
  action: 'notify_manager' | 'reassign_task' | 'create_meeting' | 'send_alert';
  priority_threshold: number;
  days_overdue_threshold: number;
  is_active: boolean;
}

class AutomationService {
  private static instance: AutomationService;
  private reportGenerationInterval: NodeJS.Timeout | null = null;
  private deadlineCheckInterval: NodeJS.Timeout | null = null;
  private escalationCheckInterval: NodeJS.Timeout | null = null;

  public static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  /**
   * Inicializar todos los servicios de automatización
   */
  public async initialize(): Promise<void> {
    try {
      // Configurar intervalos de automatización
      this.setupReportGeneration();
      this.setupDeadlineTracking();
      this.setupEscalationSystem();
      
      console.log('✅ Servicios de automatización inicializados');
    } catch (error) {
      console.error('❌ Error inicializando automatización:', error);
    }
  }

  /**
   * Configurar generación automática de reportes
   */
  private setupReportGeneration(): void {
    // Generar reporte semanal los domingos a las 9:00 AM
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(9, 0, 0, 0);
    
    const timeUntilSunday = nextSunday.getTime() - now.getTime();
    
    setTimeout(() => {
      this.generateWeeklyReport();
      // Configurar intervalo semanal
      this.reportGenerationInterval = setInterval(() => {
        this.generateWeeklyReport();
      }, 7 * 24 * 60 * 60 * 1000); // 7 días
    }, timeUntilSunday);
  }

  /**
   * Configurar seguimiento automático de deadlines
   */
  private setupDeadlineTracking(): void {
    // Verificar deadlines cada 6 horas
    this.deadlineCheckInterval = setInterval(() => {
      this.checkDeadlines();
    }, 6 * 60 * 60 * 1000); // 6 horas
  }

  /**
   * Configurar sistema de escalación
   */
  private setupEscalationSystem(): void {
    // Verificar escalaciones cada 2 horas
    this.escalationCheckInterval = setInterval(() => {
      this.checkEscalations();
    }, 2 * 60 * 60 * 1000); // 2 horas
  }

  /**
   * Generar reporte semanal automático
   */
  public async generateWeeklyReport(): Promise<Report | null> {
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      
      const weekEnd = new Date(now);

      // Obtener datos de la semana de ambas tablas de tareas
      const [tasksResult, projectTasksResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString()),
        supabase
          .from('tasks')
          .select('*')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString())
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (projectTasksResult.error) throw projectTasksResult.error;

      // Combinar tareas de ambas tablas
      const tasks = [
        ...(tasksResult.data || []).map(t => ({ ...t, table_name: 'tasks' as const })),
        ...(projectTasksResult.data || []).map(t => ({ ...t, table_name: 'tasks' as const }))
      ];

      // Calcular métricas
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const overdueTasks = tasks?.filter(t => 
        t.status !== 'completed' && 
        new Date(t.due_date) < now
      ).length || 0;

      const productivityScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Obtener top performers
      const { data: performers, error: performersError } = await supabase
        .from('tasks')
        .select(`
          assigned_to,
          users!tasks_assigned_to_fkey(name, email)
        `)
        .eq('status', 'completed')
        .gte('updated_at', weekStart.toISOString());

      if (performersError) throw performersError;

      const performerStats = new Map();
      performers?.forEach(task => {
        const userId = task.assigned_to;
        if (userId) {
          const current = performerStats.get(userId) || { tasks_completed: 0, name: task.users?.name || 'Usuario' };
          current.tasks_completed++;
          performerStats.set(userId, current);
        }
      });

      const topPerformers = Array.from(performerStats.entries())
        .map(([userId, stats]) => ({
          user_id: userId,
          name: stats.name,
          tasks_completed: stats.tasks_completed,
          efficiency_score: (stats.tasks_completed / 7) * 100 // Tareas por día
        }))
        .sort((a, b) => b.efficiency_score - a.efficiency_score)
        .slice(0, 5);

      // Obtener problemas críticos
      const { data: criticalTasks, error: criticalError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          due_date,
          assigned_to,
          users!tasks_assigned_to_fkey(name)
        `)
        .in('status', ['pending', 'in_progress'])
        .lt('due_date', now.toISOString())
        .order('due_date', { ascending: true });

      if (criticalError) throw criticalError;

      const criticalIssues = criticalTasks?.map(task => ({
        task_id: task.id,
        title: task.title,
        days_overdue: Math.ceil((now.getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24)),
        assigned_to: task.users?.name || 'Sin asignar'
      })) || [];

      // Crear reporte
      const report: Report = {
        id: `weekly_${Date.now()}`,
        type: 'weekly',
        period_start: weekStart.toISOString(),
        period_end: weekEnd.toISOString(),
        generated_at: now.toISOString(),
        data: {
          total_tasks,
          completed_tasks,
          overdue_tasks,
          productivity_score: Math.round(productivityScore),
          top_performers: topPerformers,
          critical_issues: criticalIssues,
          skill_gaps: [] // Implementar análisis de skills
        }
      };

      // Guardar reporte en base de datos
      const { error: saveError } = await supabase
        .from('automation_reports')
        .insert([report]);

      if (saveError) throw saveError;

      // Notificar a administradores
      await this.notifyAdmins('📊 Reporte Semanal Generado', 
        `Se ha generado el reporte semanal con ${completedTasks}/${totalTasks} tareas completadas.`);

      return report;
    } catch (error) {
      console.error('Error generando reporte semanal:', error);
      return null;
    }
  }

  /**
   * Generar reporte mensual automático
   */
  public async generateMonthlyReport(): Promise<Report | null> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Similar a generateWeeklyReport pero para el mes
      // Implementación similar pero con datos mensuales
      
      return null; // Placeholder
    } catch (error) {
      console.error('Error generando reporte mensual:', error);
      return null;
    }
  }

  /**
   * Asignación inteligente de tareas según habilidades
   */
  public async assignTaskIntelligently(taskId: string, tableName: 'tasks' = 'tasks'): Promise<boolean> {
    try {
      // Obtener la tarea de la tabla correspondiente
      const { data: task, error: taskError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError || !task) throw taskError;

      // Obtener usuarios con las habilidades requeridas
      const { data: users, error: usersError } = await supabase
        .from('user_skills')
        .select(`
          user_id,
          skill_name,
          proficiency_level,
          users!user_skills_user_id_fkey(id, name, email)
        `)
        .in('skill_name', task.required_skills);

      if (usersError) throw usersError;

      // Calcular score de compatibilidad para cada usuario
      const userScores = new Map();
      users?.forEach(userSkill => {
        const userId = userSkill.user_id;
        const currentScore = userScores.get(userId) || {
          user_id: userId,
          name: userSkill.users?.name || 'Usuario',
          email: userSkill.users?.email || '',
          total_score: 0,
          skills_matched: 0
        };

        // Score basado en nivel de proficiencia y experiencia
        const skillScore = userSkill.proficiency_level * 20; // 20 puntos por nivel
        currentScore.total_score += skillScore;
        currentScore.skills_matched++;
        userScores.set(userId, currentScore);
      });

      // Encontrar el mejor candidato
      const bestCandidate = Array.from(userScores.values())
        .filter(user => user.skills_matched === task.required_skills.length)
        .sort((a, b) => b.total_score - a.total_score)[0];

      if (bestCandidate) {
        // Asignar la tarea en la tabla correspondiente
        const updateData = tableName === 'tasks' 
          ? { 
              assignee: bestCandidate.user_id,
              updated_at: new Date().toISOString()
            }
          : { 
              assignee: bestCandidate.user_id,
              updated_at: new Date().toISOString()
            };

        const { error: assignError } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', taskId);

        if (assignError) throw assignError;

        // Notificar al usuario asignado
        await this.notifyUser(bestCandidate.user_id, 
          '🎯 Nueva Tarea Asignada', 
          `Se te ha asignado la tarea: "${task.title}"`);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error en asignación inteligente:', error);
      return false;
    }
  }

  /**
   * Verificar deadlines y enviar alertas
   */
  public async checkDeadlines(): Promise<void> {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);

      // Tareas que vencen en 24 horas de ambas tablas
      const [upcomingTasksResult, upcomingProjectTasksResult] = await Promise.all([
        supabase
          .from('tasks')
          .select(`
            id,
            title,
            due_date,
            assignee,
            assignee_name
          `)
          .in('status', ['pending', 'in-progress'])
          .gte('due_date', now.toISOString())
          .lte('due_date', tomorrow.toISOString()),
        supabase
          .from('tasks')
          .select(`
            id,
            title,
            due_date,
            assignee,
            assignee_name
          `)
          .eq('status', 'pending')
          .gte('due_date', now.toISOString())
          .lte('due_date', tomorrow.toISOString())
      ]);

      if (upcomingTasksResult.error) throw upcomingTasksResult.error;
      if (upcomingProjectTasksResult.error) throw upcomingProjectTasksResult.error;

      const upcomingTasks = [
        ...(upcomingTasksResult.data || []),
        ...(upcomingProjectTasksResult.data || [])
      ];

      // Enviar alertas
      for (const task of upcomingTasks || []) {
        if (task.assignee) {
          await this.notifyUser(task.assignee,
            '⏰ Deadline Próximo',
            `La tarea "${task.title}" vence mañana.`);
        }
      }

      // Tareas vencidas de ambas tablas
      const [overdueTasksResult, overdueProjectTasksResult] = await Promise.all([
        supabase
          .from('tasks')
          .select(`
            id,
            title,
            due_date,
            assignee,
            assignee_name
          `)
          .in('status', ['pending', 'in-progress'])
          .lt('due_date', now.toISOString()),
        supabase
          .from('tasks')
          .select(`
            id,
            title,
            due_date,
            assignee,
            assignee_name
          `)
          .eq('status', 'pending')
          .lt('due_date', now.toISOString())
      ]);

      if (overdueTasksResult.error) throw overdueTasksResult.error;
      if (overdueProjectTasksResult.error) throw overdueProjectTasksResult.error;

      const overdueTasks = [
        ...(overdueTasksResult.data || []),
        ...(overdueProjectTasksResult.data || [])
      ];

      // Escalar tareas vencidas
      for (const task of overdueTasks || []) {
        await this.escalateTask(task.id, 'deadline_overdue');
      }

    } catch (error) {
      console.error('Error verificando deadlines:', error);
    }
  }

  /**
   * Verificar escalaciones automáticas
   */
  public async checkEscalations(): Promise<void> {
    try {
      // Obtener reglas de escalación activas
      const { data: rules, error: rulesError } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('is_active', true);

      if (rulesError) throw rulesError;

      for (const rule of rules || []) {
        await this.applyEscalationRule(rule);
      }

    } catch (error) {
      console.error('Error verificando escalaciones:', error);
    }
  }

  /**
   * Aplicar regla de escalación
   */
  private async applyEscalationRule(rule: EscalationRule): Promise<void> {
    try {
      const conditions = JSON.parse(rule.condition);
      
      // Buscar tareas que cumplan las condiciones
      let query = supabase.from('tasks').select('*');
      
      if (conditions.priority) {
        query = query.eq('priority', conditions.priority);
      }
      
      if (conditions.days_overdue) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - conditions.days_overdue);
        query = query.lt('due_date', cutoffDate.toISOString());
      }

      const { data: tasks, error } = await query;
      if (error) throw error;

      // Aplicar acción de escalación
      for (const task of tasks || []) {
        await this.executeEscalationAction(rule.action, task);
      }

    } catch (error) {
      console.error('Error aplicando regla de escalación:', error);
    }
  }

  /**
   * Ejecutar acción de escalación
   */
  private async executeEscalationAction(action: string, task: any): Promise<void> {
    switch (action) {
      case 'notify_manager':
        await this.notifyAdmins('🚨 Tarea Crítica Requiere Atención', 
          `La tarea "${task.title}" requiere atención inmediata.`);
        break;
      
      case 'reassign_task':
        await this.assignTaskIntelligently(task.id);
        break;
      
      case 'create_meeting':
        // Crear reunión automática para discutir el problema
        await this.createUrgentMeeting(task);
        break;
      
      case 'send_alert':
        await this.sendUrgentAlert(task);
        break;
    }
  }

  /**
   * Escalar tarea específica
   */
  public async escalateTask(taskId: string, reason: string): Promise<void> {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error || !task) throw error;

      // Actualizar prioridad a crítica si no lo es
      if (task.priority !== 'critical') {
        await supabase
          .from('tasks')
          .update({ 
            priority: 'critical',
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId);
      }

      // Notificar a administradores
      await this.notifyAdmins('🚨 Tarea Escalada', 
        `La tarea "${task.title}" ha sido escalada. Razón: ${reason}`);

    } catch (error) {
      console.error('Error escalando tarea:', error);
    }
  }

  /**
   * Notificar a administradores
   */
  private async notifyAdmins(title: string, message: string): Promise<void> {
    try {
      const { data: admins, error } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('role', 'admin');

      if (error) throw error;

      for (const admin of admins || []) {
        await this.notifyUser(admin.id, title, message);
      }

    } catch (error) {
      console.error('Error notificando administradores:', error);
    }
  }

  /**
   * Notificar a usuario específico
   */
  private async notifyUser(userId: string, title: string, message: string): Promise<void> {
    try {
      // Crear notificación en base de datos
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          title,
          message,
          type: 'automation',
          is_read: false,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Mostrar toast si el usuario está activo
      toast({
        title,
        description: message,
      });

    } catch (error) {
      console.error('Error notificando usuario:', error);
    }
  }

  /**
   * Crear reunión urgente
   */
  private async createUrgentMeeting(task: any): Promise<void> {
    // Implementar creación de reunión automática
    console.log('Creando reunión urgente para tarea:', task.title);
  }

  /**
   * Enviar alerta urgente
   */
  private async sendUrgentAlert(task: any): Promise<void> {
    // Implementar sistema de alertas urgentes
    console.log('Enviando alerta urgente para tarea:', task.title);
  }

  /**
   * Detener todos los servicios de automatización
   */
  public stop(): void {
    if (this.reportGenerationInterval) {
      clearInterval(this.reportGenerationInterval);
    }
    if (this.deadlineCheckInterval) {
      clearInterval(this.deadlineCheckInterval);
    }
    if (this.escalationCheckInterval) {
      clearInterval(this.escalationCheckInterval);
    }
  }
}

export const automationService = AutomationService.getInstance();
