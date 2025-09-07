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

      // Consulta de proyectos - datos completos
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            id, name, description, status, priority, 
            start_date, end_date, completion_percentage,
            created_at, updated_at, created_by
          `)
          .limit(10);
        
        if (error) {
          console.warn('Error consultando proyectos:', error.message);
        } else {
          projects = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de proyectos:', error);
      }

      // Consulta de usuarios - datos completos
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email, avatar_url, created_at, last_login')
          .limit(10);
        
        if (error) {
          console.warn('Error consultando usuarios:', error.message);
        } else {
          users = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de usuarios:', error);
      }

      // Consulta de tickets - solo columnas que existen
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('id, asunto, created_at, updated_at')
          .limit(10);
        
        if (error) {
          console.warn('Error consultando tickets:', error.message);
        } else {
          tickets = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de tickets:', error);
      }

      // Consulta de tareas - solo columnas que existen
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, created_at, updated_at')
          .limit(20);
        
        if (error) {
          console.warn('Error consultando tareas:', error.message);
        } else {
          tasks = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de tareas:', error);
      }

      // Consulta de fases - solo columnas que existen
      try {
        const { data, error } = await supabase
          .from('project_phases')
          .select('id, created_at, updated_at')
          .limit(10);
        
        if (error) {
          console.warn('Error consultando fases:', error.message);
        } else {
          phases = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de fases:', error);
      }

      // Consulta de métricas - solo columnas que existen
      try {
        const { data, error } = await supabase
          .from('project_metrics')
          .select('id, created_at')
          .limit(20);
        
        if (error) {
          console.warn('Error consultando métricas:', error.message);
        } else {
          metrics = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de métricas:', error);
      }

      // Consulta de actividades - solo columnas que existen
      try {
        const { data, error } = await supabase
          .from('project_activity_log')
          .select('id, created_at')
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

      // Consulta de archivos adjuntos - solo columnas que existen
      try {
        const { data, error } = await supabase
          .from('project_attachments')
          .select('id, created_at')
          .limit(10);
        
        if (error) {
          console.warn('Error consultando archivos:', error.message);
        } else {
          attachments = data || [];
        }
      } catch (error) {
        console.warn('Error en consulta de archivos:', error);
      }

      // Consulta de comentarios - solo columnas que existen
      try {
        const { data, error } = await supabase
          .from('task_comments')
          .select('id, created_at')
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

      // Consulta de dependencias - solo columnas que existen
      try {
        const { data, error } = await supabase
          .from('task_dependencies')
          .select('id, created_at')
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
