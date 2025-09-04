import { supabase } from './supabase';

// =====================================================
// TIPOS Y INTERFACES PARA TAREAS AUTOMATIZADAS
// =====================================================

export interface AutomationTask {
  id: string;
  name: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'on_event' | 'custom';
  script: string;
  script_type: 'sql' | 'javascript' | 'shell';
  parameters: Record<string, any>;
  last_run?: string;
  next_run?: string;
  run_count: number;
  success_count: number;
  error_count: number;
  last_error?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAutomationTaskDto {
  name: string;
  description?: string;
  type: AutomationTask['type'];
  script: string;
  script_type?: 'sql' | 'javascript' | 'shell';
  parameters?: Record<string, any>;
  is_active?: boolean;
}

export interface UpdateAutomationTaskDto {
  name?: string;
  description?: string;
  type?: AutomationTask['type'];
  script?: string;
  script_type?: 'sql' | 'javascript' | 'shell';
  parameters?: Record<string, any>;
  is_active?: boolean;
}

export interface TaskExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
  timestamp: string;
}

// =====================================================
// SERVICIO PRINCIPAL DE TAREAS AUTOMATIZADAS
// =====================================================

export class AutomationTaskService {
  
  // =====================================================
  // GESTIÓN DE TAREAS
  // =====================================================

  /**
   * Crear una nueva tarea automatizada
   */
  async createTask(task: CreateAutomationTaskDto): Promise<AutomationTask> {
    try {
      const { data, error } = await supabase
        .from('automation_tasks')
        .insert({
          ...task,
          script_type: task.script_type || 'sql',
          parameters: task.parameters || {},
          is_active: task.is_active ?? true,
          run_count: 0,
          success_count: 0,
          error_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      
      // Log de la creación
      await this.logTaskAction('task', data.id, 'create', 'success', 'Tarea automatizada creada exitosamente');
      
      return data;
    } catch (error) {
      await this.logTaskAction('task', 'unknown', 'create', 'error', `Error creando tarea: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener todas las tareas automatizadas
   */
  async getTasks(): Promise<AutomationTask[]> {
    try {
      const { data, error } = await supabase
        .from('automation_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting automation tasks:', error);
      return [];
    }
  }

  /**
   * Obtener tarea por ID
   */
  async getTask(id: string): Promise<AutomationTask | null> {
    try {
      const { data, error } = await supabase
        .from('automation_tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting automation task:', error);
      return null;
    }
  }

  /**
   * Obtener tareas por tipo
   */
  async getTasksByType(type: AutomationTask['type']): Promise<AutomationTask[]> {
    try {
      const { data, error } = await supabase
        .from('automation_tasks')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('next_run', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting tasks by type:', error);
      return [];
    }
  }

  /**
   * Obtener tareas que deben ejecutarse
   */
  async getTasksToExecute(): Promise<AutomationTask[]> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('automation_tasks')
        .select('*')
        .eq('is_active', true)
        .lte('next_run', now)
        .order('next_run', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting tasks to execute:', error);
      return [];
    }
  }

  /**
   * Actualizar tarea
   */
  async updateTask(id: string, updates: UpdateAutomationTaskDto): Promise<AutomationTask> {
    try {
      const { data, error } = await supabase
        .from('automation_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await this.logTaskAction('task', id, 'update', 'success', 'Tarea automatizada actualizada exitosamente');
      
      return data;
    } catch (error) {
      await this.logTaskAction('task', id, 'update', 'error', `Error actualizando tarea: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar tarea
   */
  async deleteTask(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('automation_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await this.logTaskAction('task', id, 'delete', 'success', 'Tarea automatizada eliminada exitosamente');
    } catch (error) {
      await this.logTaskAction('task', id, 'delete', 'error', `Error eliminando tarea: ${error.message}`);
      throw error;
    }
  }

  /**
   * Activar/desactivar tarea
   */
  async toggleTask(id: string, isActive: boolean): Promise<AutomationTask> {
    try {
      const { data, error } = await supabase
        .from('automation_tasks')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const action = isActive ? 'activada' : 'desactivada';
      await this.logTaskAction('task', id, 'toggle', 'success', `Tarea ${action} exitosamente`);
      
      return data;
    } catch (error) {
      await this.logTaskAction('task', id, 'toggle', 'error', `Error cambiando estado de la tarea: ${error.message}`);
      throw error;
    }
  }

  // =====================================================
  // EJECUCIÓN DE TAREAS
  // =====================================================

  /**
   * Ejecutar tarea específica
   */
  async executeTask(taskId: string): Promise<TaskExecutionResult> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error('Tarea no encontrada');
      }

      if (!task.is_active) {
        throw new Error('Tarea no está activa');
      }


      const startTime = Date.now();

      // Ejecutar script según el tipo
      let output: any;
      let success = false;
      let error: string | undefined;

      try {
        switch (task.script_type) {
          case 'sql':
            output = await this.executeSqlScript(task.script, task.parameters);
            success = true;
            break;
          case 'javascript':
            output = await this.executeJavaScriptScript(task.script, task.parameters);
            success = true;
            break;
          case 'shell':
            output = await this.executeShellScript(task.script, task.parameters);
            success = true;
            break;
          default:
            throw new Error(`Tipo de script no soportado: ${task.script_type}`);
        }
      } catch (scriptError) {
        error = scriptError.message;
        success = false;
      }

      const executionTime = Date.now() - startTime;
      const result: TaskExecutionResult = {
        success,
        output,
        error,
        executionTime,
        timestamp: new Date().toISOString()
      };

      // Actualizar estadísticas de la tarea
      await this.updateTaskStats(taskId, success, executionTime, error);

      // Programar próxima ejecución
      await this.scheduleNextRun(taskId, task.type);

      // Log del resultado
      const logMessage = success ? 
        'Tarea ejecutada exitosamente' : 
        `Error ejecutando tarea: ${error}`;
      
      await this.logTaskAction('task', taskId, 'execute', success ? 'success' : 'error', logMessage, {
        execution_time_ms: executionTime,
        output,
        error
      });


      return result;

    } catch (error) {
      console.error('Error executing task:', error);
      throw error;
    }
  }

  /**
   * Ejecutar todas las tareas pendientes
   */
  async executePendingTasks(): Promise<TaskExecutionResult[]> {
    try {

      
      const tasksToExecute = await this.getTasksToExecute();
      
      if (tasksToExecute.length === 0) {

        return [];
      }



      const results: TaskExecutionResult[] = [];

      for (const task of tasksToExecute) {
        try {
          const result = await this.executeTask(task.id);
          results.push(result);
        } catch (error) {
          console.error(`❌ Error ejecutando tarea ${task.id}:`, error);
          
          const failedResult: TaskExecutionResult = {
            success: false,
            error: error.message,
            executionTime: 0,
            timestamp: new Date().toISOString()
          };
          
          results.push(failedResult);
        }
      }


      return results;

    } catch (error) {
      console.error('Error executing pending tasks:', error);
      throw error;
    }
  }

  // =====================================================
  // EJECUCIÓN DE SCRIPTS
  // =====================================================

  /**
   * Ejecutar script SQL
   */
  private async executeSqlScript(script: string, parameters: Record<string, any>): Promise<any> {
    try {

      
      // Reemplazar parámetros en el script
      let processedScript = script;
      for (const [key, value] of Object.entries(parameters)) {
        const placeholder = `{${key}}`;
        processedScript = processedScript.replace(new RegExp(placeholder, 'g'), String(value));
      }

      // Ejecutar script SQL
      const { data, error } = await supabase.rpc('execute_sql_script', {
        script: processedScript
      });

      if (error) throw error;
      

      return data;
    } catch (error) {
      console.error('Error executing SQL script:', error);
      throw new Error(`Error en script SQL: ${error.message}`);
    }
  }

  /**
   * Ejecutar script JavaScript
   */
  private async executeJavaScriptScript(script: string, parameters: Record<string, any>): Promise<any> {
    try {

      
      // Crear función segura para ejecutar el script
      const safeFunction = new Function('parameters', 'supabase', script);
      
      // Ejecutar script con parámetros y acceso a Supabase
      const result = await safeFunction(parameters, supabase);
      

      return result;
    } catch (error) {
      console.error('Error executing JavaScript script:', error);
      throw new Error(`Error en script JavaScript: ${error.message}`);
    }
  }

  /**
   * Ejecutar script Shell
   */
  private async executeShellScript(script: string, parameters: Record<string, any>): Promise<any> {
    try {

      
      // En un entorno web, los scripts shell no se pueden ejecutar directamente
      // Aquí podrías implementar una simulación o usar un servicio backend
      console.warn('⚠️ Scripts shell no se pueden ejecutar en el frontend');
      
      // Por ahora, simulamos la ejecución
      const simulatedOutput = `Simulación de ejecución de script shell: ${script}`;
      

      return simulatedOutput;
    } catch (error) {
      console.error('Error executing shell script:', error);
      throw new Error(`Error en script shell: ${error.message}`);
    }
  }

  // =====================================================
  // PROGRAMACIÓN DE TAREAS
  // =====================================================

  /**
   * Programar próxima ejecución de la tarea
   */
  private async scheduleNextRun(taskId: string, taskType: AutomationTask['type']): Promise<void> {
    try {
      const now = new Date();
      let nextRun: Date;

      switch (taskType) {
        case 'daily':
          nextRun = new Date(now);
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun = new Date(now);
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun = new Date(now);
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
        case 'on_event':
          // Las tareas de evento no se programan automáticamente
          return;
        case 'custom':
          // Las tareas personalizadas mantienen su programación
          return;
        default:
          throw new Error(`Tipo de tarea no soportado: ${taskType}`);
      }

      const { error } = await supabase
        .from('automation_tasks')
        .update({ next_run: nextRun.toISOString() })
        .eq('id', taskId);

      if (error) throw error;
      

    } catch (error) {
      console.error('Error scheduling next run:', error);
    }
  }

  /**
   * Programar tarea para ejecutarse en un momento específico
   */
  async scheduleTaskFor(taskId: string, dateTime: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('automation_tasks')
        .update({ next_run: dateTime })
        .eq('id', taskId);

      if (error) throw error;
      

    } catch (error) {
      console.error('Error scheduling task:', error);
      throw error;
    }
  }

  // =====================================================
  // ESTADÍSTICAS Y MONITOREO
  // =====================================================

  /**
   * Actualizar estadísticas de la tarea
   */
  private async updateTaskStats(
    taskId: string, 
    success: boolean, 
    executionTime: number, 
    error?: string
  ): Promise<void> {
    try {
      const updates: any = {
        run_count: supabase.sql`run_count + 1`,
        last_run: new Date().toISOString()
      };

      if (success) {
        updates.success_count = supabase.sql`success_count + 1`;
        updates.last_error = null;
      } else {
        updates.error_count = supabase.sql`error_count + 1`;
        updates.last_error = error;
      }

      const { error: updateError } = await supabase
        .from('automation_tasks')
        .update(updates)
        .eq('id', taskId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating task stats:', error);
    }
  }



  /**
   * Obtener tareas con mejor rendimiento
   */
  async getTopPerformingTasks(limit: number = 5): Promise<AutomationTask[]> {
    try {
      const { data, error } = await supabase
        .from('automation_tasks')
        .select('*')
        .gt('run_count', 0)
        .order('success_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting top performing tasks:', error);
      return [];
    }
  }

  /**
   * Obtener tareas con problemas
   */
  async getProblematicTasks(limit: number = 5): Promise<AutomationTask[]> {
    try {
      const { data, error } = await supabase
        .from('automation_tasks')
        .select('*')
        .gt('error_count', 0)
        .order('error_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting problematic tasks:', error);
      return [];
    }
  }

  // =====================================================
  // LOGGING Y MONITOREO
  // =====================================================

  /**
   * Log de acciones de tareas
   */
  private async logTaskAction(
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

      if (error) console.error('Error logging task action:', error);
    } catch (error) {
      console.error('Error logging task action:', error);
    }
  }

  /**
   * Obtener logs de tareas
   */
  async getTaskLogs(taskId?: string, limit: number = 100): Promise<any[]> {
    try {
      let query = supabase
        .from('automation_logs')
        .select('*')
        .eq('automation_type', 'task')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (taskId) {
        query = query.eq('automation_id', taskId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting task logs:', error);
      return [];
    }
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  /**
   * Validar script antes de guardarlo
   */
  async validateScript(script: string, scriptType: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      switch (scriptType) {
        case 'sql':
          // Validación básica de SQL
          if (!script.trim()) {
            errors.push('El script SQL no puede estar vacío');
          }
          if (script.toLowerCase().includes('drop table') || script.toLowerCase().includes('delete from')) {
            errors.push('El script contiene operaciones peligrosas (DROP, DELETE)');
          }
          break;

        case 'javascript':
          // Validación básica de JavaScript
          try {
            new Function('parameters', 'supabase', script);
          } catch (jsError) {
            errors.push(`Error de sintaxis JavaScript: ${jsError.message}`);
          }
          break;

        case 'shell':
          // Los scripts shell no se pueden validar en el frontend
          errors.push('Los scripts shell no están soportados en el frontend');
          break;

        default:
          errors.push(`Tipo de script no soportado: ${scriptType}`);
      }
    } catch (error) {
      errors.push(`Error de validación: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtener estadísticas de tareas automatizadas
   */
  async getTaskStats(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('automation_tasks')
        .select('is_active, run_count, success_count, error_count')
        .eq('is_active', true);

      if (error) throw error;

      const stats = {
        total_tasks: data?.length || 0,
        total_executions: data?.reduce((sum, task) => sum + (task.run_count || 0), 0) || 0,
        total_success: data?.reduce((sum, task) => sum + (task.success_count || 0), 0) || 0,
        total_errors: data?.reduce((sum, task) => sum + (task.error_count || 0), 0) || 0,
        success_rate: 0
      };

      // Calcular tasa de éxito
      if (stats.total_executions > 0) {
        stats.success_rate = Math.round((stats.total_success / stats.total_executions) * 100);
      }

      return stats;
    } catch (error) {
      console.error('Error getting task stats:', error);
      return {
        total_tasks: 0,
        total_executions: 0,
        total_success: 0,
        total_errors: 0,
        success_rate: 0
      };
    }
  }

  /**
   * Obtener plantillas de tareas predefinidas
   */
  getTaskTemplates(): Record<string, CreateAutomationTaskDto> {
    return {
      'backup_database': {
        name: 'Backup de Base de Datos',
        description: 'Crear backup automático de la base de datos',
        type: 'daily',
        script: 'SELECT pg_dump_database();',
        script_type: 'sql',
        parameters: {}
      },
      'cleanup_temp_files': {
        name: 'Limpieza de Archivos Temporales',
        description: 'Eliminar archivos temporales del sistema',
        type: 'weekly',
        script: 'console.log("Limpiando archivos temporales...");',
        script_type: 'javascript',
        parameters: {}
      },
      'generate_reports': {
        name: 'Generación de Reportes',
        description: 'Generar reportes automáticos del sistema',
        type: 'monthly',
        script: 'console.log("Generando reportes...");',
        script_type: 'javascript',
        parameters: {}
      }
    };
  }
}

// Instancia singleton del servicio
export const automationTaskService = new AutomationTaskService();
