import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para obtener contexto de la base de datos de manera segura
 * Evita errores 400 usando solo columnas que existen
 */
export const useSupabaseContext = () => {
  const getDatabaseContext = useCallback(async () => {
    try {
      let projects = [];
      let users = [];
      let tickets = [];
      let tasks = [];
      let phases = [];
      let metrics = [];
      let activities = [];
      let attachments = [];
      let comments = [];
      let dependencies = [];

      // Consulta de proyectos - columnas reales según BASEDEDATOSCOMPLETA.sql
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, description, status, created_at, updated_at')
          .limit(10);
        
        if (error) {
          console.warn('Error consultando proyectos:', error.message);
        } else {
          projects = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de proyectos:', error);
      }

      // Consulta de usuarios - columnas reales según BASEDEDATOSCOMPLETA.sql
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, role, created_at, updated_at')
          .limit(10);
        
        if (error) {
          console.warn('Error consultando usuarios:', error.message);
        } else {
          users = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de usuarios:', error);
      }

      // Consulta de tickets - columnas reales según BASEDEDATOSCOMPLETA.sql
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('id, asunto, mensaje, email, estado, prioridad, created_at, updated_at')
          .limit(10);
        
        if (error) {
          console.warn('Error consultando tickets:', error.message);
        } else {
          tickets = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de tickets:', error);
      }

      // Consulta de tareas - columnas reales según BASEDEDATOSCOMPLETA.sql
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, description, status, priority, assignee, assignee_name, created_at, updated_at')
          .limit(20);
        
        if (error) {
          console.warn('Error consultando tareas:', error.message);
        } else {
          tasks = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de tareas:', error);
      }

      // Consulta de fases - tabla real project_phases
      try {
        const { data, error } = await supabase
          .from('project_phases')
          .select('id, name, description, status, phase_order, created_at, updated_at')
          .limit(10);
        
        if (error) {
          console.warn('Error consultando fases:', error.message);
        } else {
          phases = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de fases:', error);
      }

      // Consulta de métricas - tabla real project_metrics
      try {
        const { data, error } = await supabase
          .from('project_metrics')
          .select('id, metric_date, completion_percentage, task_count, completed_tasks, created_at')
          .limit(20);
        
        if (error) {
          console.warn('Error consultando métricas:', error.message);
        } else {
          metrics = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de métricas:', error);
      }

      // Consulta de actividades - tabla real project_activity_log
      try {
        const { data, error } = await supabase
          .from('project_activity_log')
          .select('id, action, description, created_at')
          .order('created_at', { ascending: false })
          .limit(15);
        
        if (error) {
          console.warn('Error consultando actividades:', error.message);
        } else {
          activities = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de actividades:', error);
      }

      // Consulta de archivos - tabla real project_attachments
      try {
        const { data, error } = await supabase
          .from('project_attachments')
          .select('id, file_name, file_path, mime_type, file_size, created_at')
          .limit(10);
        
        if (error) {
          console.warn('Error consultando archivos:', error.message);
        } else {
          attachments = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de archivos:', error);
      }

      // Consulta de comentarios - tabla real task_comments
      try {
        const { data, error } = await supabase
          .from('task_comments')
          .select('id, comment, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(15);
        
        if (error) {
          console.warn('Error consultando comentarios:', error.message);
        } else {
          comments = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de comentarios:', error);
      }

      // Consulta de dependencias - tabla real task_dependencies
      try {
        const { data, error } = await supabase
          .from('task_dependencies')
          .select('id, task_id, depends_on_task_id, dependency_type, created_at')
          .limit(10);
        
        if (error) {
          console.warn('Error consultando dependencias:', error.message);
        } else {
          dependencies = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de dependencias:', error);
      }

      return {
        projects,
        users,
        tickets,
        tasks,
        phases,
        metrics,
        activities,
        attachments,
        comments,
        dependencies,
        timestamp: new Date().toISOString(),
        hasData: projects.length > 0 || users.length > 0 || tickets.length > 0,
        totalRecords: {
          projects: projects.length,
          users: users.length,
          tickets: tickets.length,
          tasks: tasks.length,
          phases: phases.length,
          metrics: metrics.length,
          activities: activities.length,
          attachments: attachments.length,
          comments: comments.length,
          dependencies: dependencies.length
        }
      };
    } catch (error) {
      console.warn('Error general obteniendo contexto:', error);
      return {
        projects: [],
        users: [],
        tickets: [],
        tasks: [],
        phases: [],
        metrics: [],
        activities: [],
        attachments: [],
        comments: [],
        dependencies: [],
        timestamp: new Date().toISOString(),
        hasData: false,
        totalRecords: {
          projects: 0,
          users: 0,
          tickets: 0,
          tasks: 0,
          phases: 0,
          metrics: 0,
          activities: 0,
          attachments: 0,
          comments: 0,
          dependencies: 0
        }
      };
    }
  }, []);

  return { getDatabaseContext };
};
