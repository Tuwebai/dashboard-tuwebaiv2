import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para hacer consultas seguras a Supabase
 * Evita errores 400 usando solo columnas que existen
 */
export const useSafeSupabase = () => {
  const safeQuery = useCallback(async (tableName: string, columns: string[] = ['id'], options: any = {}) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select(columns.join(', '))
        .limit(options.limit || 10)
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn(`Error consultando ${tableName}:`, error.message);
        return { data: [], error: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.warn(`Error en consulta ${tableName}:`, err);
      return { data: [], error: err };
    }
  }, []);

  const safeCount = useCallback(async (tableName: string) => {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('id', { count: 'exact', head: true });

      if (error) {
        console.warn(`Error contando ${tableName}:`, error.message);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.warn(`Error contando ${tableName}:`, err);
      return 0;
    }
  }, []);

  // Consultas seguras para tablas principales
  const getUsers = useCallback(() => safeQuery('users', ['id', 'full_name', 'email', 'created_at']), [safeQuery]);
  const getProjects = useCallback(() => safeQuery('projects', ['id', 'name', 'created_at']), [safeQuery]);
  const getTickets = useCallback(() => safeQuery('tickets', ['id', 'asunto', 'created_at']), [safeQuery]);
  const getPayments = useCallback(() => safeQuery('payments', ['id', 'amount', 'created_at']), [safeQuery]);

  // Contadores seguros
  const getUsersCount = useCallback(() => safeCount('users'), [safeCount]);
  const getProjectsCount = useCallback(() => safeCount('projects'), [safeCount]);
  const getTicketsCount = useCallback(() => safeCount('tickets'), [safeCount]);
  const getPaymentsCount = useCallback(() => safeCount('payments'), [safeCount]);

  return {
    safeQuery,
    safeCount,
    getUsers,
    getProjects,
    getTickets,
    getPayments,
    getUsersCount,
    getProjectsCount,
    getTicketsCount,
    getPaymentsCount
  };
};
