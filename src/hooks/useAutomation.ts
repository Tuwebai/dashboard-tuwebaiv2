import { useState, useEffect, useCallback } from 'react';
import { automationService, Task, UserSkill, Report } from '@/lib/automationService';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface AutomationStats {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  critical_tasks: number;
  completion_rate: number;
}

export interface SkillGap {
  skill_name: string;
  required_count: number;
  available_count: number;
  gap_percentage: number;
}

export const useAutomation = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar servicios de automatización
  const initializeAutomation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await automationService.initialize();
      setIsInitialized(true);
      
      toast({
        title: "Automatización Iniciada",
        description: "Los servicios de automatización están activos",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast({
        title: "Error de Inicialización",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar estadísticas de automatización
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: statsError } = await supabase
        .from('automation_dashboard')
        .select('*')
        .single();

      if (statsError) throw statsError;

      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cargando estadísticas';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generar reporte
  const generateReport = useCallback(async (type: 'weekly' | 'monthly') => {
    try {
      setLoading(true);
      setError(null);

      let report: Report | null = null;
      
      if (type === 'weekly') {
        report = await automationService.generateWeeklyReport();
      } else {
        report = await automationService.generateMonthlyReport();
      }

      if (report) {
        toast({
          title: "Reporte Generado",
          description: `Reporte ${type === 'weekly' ? 'semanal' : 'mensual'} generado exitosamente`,
        });
        
        // Recargar estadísticas
        await loadStats();
      } else {
        throw new Error('No se pudo generar el reporte');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error generando reporte';
      setError(errorMessage);
      toast({
        title: "Error Generando Reporte",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  // Asignar tarea inteligentemente
  const assignTaskIntelligently = useCallback(async (taskId: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await automationService.assignTaskIntelligently(taskId);
      
      if (success) {
        toast({
          title: "Tarea Asignada",
          description: "La tarea ha sido asignada automáticamente",
        });
        
        // Recargar estadísticas
        await loadStats();
      } else {
        throw new Error('No se pudo asignar la tarea automáticamente');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error asignando tarea';
      setError(errorMessage);
      toast({
        title: "Error Asignando Tarea",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  // Escalar tarea
  const escalateTask = useCallback(async (taskId: string, reason: string) => {
    try {
      setLoading(true);
      setError(null);

      await automationService.escalateTask(taskId, reason);
      
      toast({
        title: "Tarea Escalada",
        description: "La tarea ha sido escalada a los administradores",
      });
      
      // Recargar estadísticas
      await loadStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error escalando tarea';
      setError(errorMessage);
      toast({
        title: "Error Escalando Tarea",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  // Obtener tareas vencidas
  const getOverdueTasks = useCallback(async (): Promise<Task[]> => {
    try {
      const [tasksResult, projectTasksResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .in('status', ['pending', 'in-progress'])
          .lt('due_date', new Date().toISOString())
          .order('due_date', { ascending: true }),
        supabase
          .from('tasks')
          .select('*')
          .eq('status', 'pending')
          .lt('due_date', new Date().toISOString())
          .order('due_date', { ascending: true })
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (projectTasksResult.error) throw projectTasksResult.error;

      const tasks = [
        ...(tasksResult.data || []).map(t => ({ ...t, table_name: 'tasks' as const })),
        ...(projectTasksResult.data || []).map(t => ({ ...t, table_name: 'tasks' as const }))
      ];

      return tasks;
    } catch (err) {
      console.error('Error obteniendo tareas vencidas:', err);
      return [];
    }
  }, []);

  // Obtener análisis de habilidades
  const getSkillAnalysis = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_skill_statistics');

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error obteniendo análisis de habilidades:', err);
      return [];
    }
  }, []);

  // Obtener gaps de habilidades
  const getSkillGaps = useCallback(async (): Promise<SkillGap[]> => {
    try {
      const skillData = await getSkillAnalysis();
      
      // Calcular gaps de skills (simulado por ahora)
      const gaps: SkillGap[] = skillData.map((skill: any) => ({
        skill_name: skill.skill_name,
        required_count: Math.floor(Math.random() * 10) + 5,
        available_count: skill.total_users,
        gap_percentage: Math.max(0, 
          ((Math.floor(Math.random() * 10) + 5) - skill.total_users) / 
          (Math.floor(Math.random() * 10) + 5) * 100
        )
      }));

      return gaps;
    } catch (err) {
      console.error('Error obteniendo gaps de habilidades:', err);
      return [];
    }
  }, [getSkillAnalysis]);

  // Obtener reportes
  const getReports = useCallback(async (limit: number = 10): Promise<Report[]> => {
    try {
      const { data, error } = await supabase
        .from('automation_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error obteniendo reportes:', err);
      return [];
    }
  }, []);

  // Obtener tareas que necesitan reasignación
  const getTasksNeedingReassignment = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_tasks_needing_reassignment');

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error obteniendo tareas para reasignación:', err);
      return [];
    }
  }, []);

  // Agregar habilidad de usuario
  const addUserSkill = useCallback(async (skill: Omit<UserSkill, 'id' | 'created_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('user_skills')
        .insert([skill]);

      if (insertError) throw insertError;

      toast({
        title: "Habilidad Agregada",
        description: "La habilidad ha sido agregada al perfil del usuario",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error agregando habilidad';
      setError(errorMessage);
      toast({
        title: "Error Agregando Habilidad",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar habilidad de usuario
  const updateUserSkill = useCallback(async (skillId: string, updates: Partial<UserSkill>) => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('user_skills')
        .update(updates)
        .eq('id', skillId);

      if (updateError) throw updateError;

      toast({
        title: "Habilidad Actualizada",
        description: "La habilidad ha sido actualizada exitosamente",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error actualizando habilidad';
      setError(errorMessage);
      toast({
        title: "Error Actualizando Habilidad",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Inicializar automáticamente al montar el componente
  useEffect(() => {
    if (!isInitialized) {
      initializeAutomation();
    }
  }, [isInitialized, initializeAutomation]);

  // Cargar estadísticas al inicializar
  useEffect(() => {
    if (isInitialized) {
      loadStats();
    }
  }, [isInitialized, loadStats]);

  return {
    // Estado
    isInitialized,
    stats,
    loading,
    error,
    
    // Acciones
    initializeAutomation,
    loadStats,
    generateReport,
    assignTaskIntelligently,
    escalateTask,
    
    // Datos
    getOverdueTasks,
    getSkillAnalysis,
    getSkillGaps,
    getReports,
    getTasksNeedingReassignment,
    
    // Habilidades
    addUserSkill,
    updateUserSkill,
  };
};
