import { supabase } from './supabase';

export interface ProjectPhase {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  phase_order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  start_date?: string;
  end_date?: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Task {
  id: string;
  project_id: string;
  phase_id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours: number;
  completion_percentage: number;
  tags?: string[];
  dependencies?: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectMetrics {
  id: string;
  project_id: string;
  metric_date: string;
  completion_percentage: number;
  velocity_points: number;
  bug_count: number;
  task_count: number;
  completed_tasks: number;
  overdue_tasks: number;
  total_hours_estimated: number;
  total_hours_actual: number;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectAttachment {
  id: string;
  project_id?: string;
  task_id?: string;
  phase_id?: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  created_at: string;
}

class ProjectManagementService {
  // ===========================================
  // GESTIÓN DE FASES
  // ===========================================

  /**
   * Obtener todas las fases de un proyecto
   */
  async getProjectPhases(projectId: string): Promise<ProjectPhase[]> {
    try {
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('phase_order', { ascending: true })
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error obteniendo fases del proyecto:', error);
      throw error;
    }
  }

  /**
   * Crear una nueva fase en un proyecto
   */
  async createPhase(
    projectId: string,
    phaseData: {
      name: string;
      description?: string;
      phase_order: number;
      start_date?: string;
      end_date?: string;
    },
    userId: string
  ): Promise<ProjectPhase> {
    try {
      const { data, error } = await supabase
        .rpc('create_phase_with_validation', {
          p_project_id: projectId,
          p_name: phaseData.name,
          p_description: phaseData.description,
          p_phase_order: phaseData.phase_order,
          p_start_date: phaseData.start_date,
          p_end_date: phaseData.end_date,
          p_created_by: userId
        })
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }

      // Obtener la fase creada
      const { data: phase, error: fetchError } = await supabase
        .from('project_phases')
        .select('*')
        .eq('id', data)
        .single()
        .abortSignal(AbortSignal.timeout(10000));

      if (fetchError) throw fetchError;
      return phase;
    } catch (error) {
      console.error('Error creando fase:', error);
      throw error;
    }
  }

  /**
   * Actualizar una fase
   */
  async updatePhase(phaseId: string, updates: Partial<ProjectPhase>): Promise<ProjectPhase> {
    try {
      const { data, error } = await supabase
        .from('project_phases')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', phaseId)
        .select()
        .single()
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }
      return data;
    } catch (error) {
      console.error('Error actualizando fase:', error);
      throw error;
    }
  }

  // ===========================================
  // GESTIÓN DE TAREAS
  // ===========================================

  /**
   * Obtener todas las tareas de un proyecto
   */
  async getProjectTasks(projectId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error obteniendo tareas del proyecto:', error);
      throw error;
    }
  }

  /**
   * Obtener tareas de una fase específica
   */
  async getPhaseTasks(phaseId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('phase_id', phaseId)
        .order('created_at', { ascending: false })
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error obteniendo tareas de la fase:', error);
      throw error;
    }
  }

  /**
   * Crear una nueva tarea
   */
  async createTask(
    projectId: string,
    taskData: {
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      assigned_to?: string;
      due_date?: string;
      phase_id?: string;
      estimated_hours?: number;
      tags?: string[];
    },
    userId: string
  ): Promise<Task> {
    try {
      const { data, error } = await supabase
        .rpc('create_task_with_validation', {
          p_project_id: projectId,
          p_title: taskData.title,
          p_description: taskData.description,
          p_priority: taskData.priority || 'medium',
          p_assigned_to: taskData.assigned_to,
          p_due_date: taskData.due_date,
          p_phase_id: taskData.phase_id,
          p_created_by: userId
        })
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }

      // Obtener la tarea creada
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', data)
        .single()
        .abortSignal(AbortSignal.timeout(10000));

      if (fetchError) throw fetchError;

      // Actualizar tags si se proporcionaron
      if (taskData.tags && taskData.tags.length > 0) {
        await supabase
          .from('tasks')
          .update({ tags: taskData.tags })
          .eq('id', data)
          .abortSignal(AbortSignal.timeout(10000));
      }

      return task;
    } catch (error) {
      console.error('Error creando tarea:', error);
      throw error;
    }
  }

  /**
   * Actualizar una tarea
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }
      return data;
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      throw error;
    }
  }

  /**
   * Marcar tarea como completada
   */
  async completeTask(taskId: string, completionPercentage: number = 100): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completion_percentage: completionPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }
      return data;
    } catch (error) {
      console.error('Error completando tarea:', error);
      throw error;
    }
  }

  // ===========================================
  // MÉTRICAS Y ANÁLISIS
  // ===========================================

  /**
   * Obtener métricas de un proyecto
   */
  async getProjectMetrics(projectId: string): Promise<ProjectMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('project_metrics')
        .select('*')
        .eq('project_id', projectId)
        .order('metric_date', { ascending: false })
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error obteniendo métricas del proyecto:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de proyecto
   */
  async getProjectSummary(projectId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('project_summary')
        .select('*')
        .eq('id', projectId)
        .single()
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }
      return data;
    } catch (error) {
      console.error('Error obteniendo resumen del proyecto:', error);
      throw error;
    }
  }

  /**
   * Obtener progreso de proyecto usando función SQL
   */
  async getProjectProgress(projectId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_project_progress', { project_uuid: projectId })
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }
      return data?.[0] || null;
    } catch (error) {
      console.error('Error obteniendo progreso del proyecto:', error);
      throw error;
    }
  }

  // ===========================================
  // COMENTARIOS Y ARCHIVOS
  // ===========================================

  /**
   * Agregar comentario a una tarea
   */
  async addTaskComment(taskId: string, comment: string, userId: string): Promise<TaskComment> {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: userId,
          comment: comment
        })
        .select()
        .single()
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }
      return data;
    } catch (error) {
      console.error('Error agregando comentario:', error);
      throw error;
    }
  }

  /**
   * Obtener comentarios de una tarea
   */
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error obteniendo comentarios:', error);
      throw error;
    }
  }

  // ===========================================
  // UTILIDADES PARA WEBSY AI
  // ===========================================

  /**
   * Buscar proyectos por nombre
   */
  async searchProjects(query: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, status, completion_percentage')
        .ilike('name', `%${query}%`)
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error buscando proyectos:', error);
      throw error;
    }
  }

  /**
   * Obtener usuarios disponibles para asignar tareas
   */
  async getAvailableUsers(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  /**
   * Obtener siguiente orden de fase para un proyecto
   */
  async getNextPhaseOrder(projectId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('project_phases')
        .select('phase_order')
        .eq('project_id', projectId)
        .order('phase_order', { ascending: false })
        .limit(1)
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error consultando project_phases:', error.message);
        return [];
      }
      return data?.[0]?.phase_order ? data[0].phase_order + 1 : 1;
    } catch (error) {
      console.error('Error obteniendo siguiente orden de fase:', error);
      return 1;
    }
  }
}

export const projectManagementService = new ProjectManagementService();

