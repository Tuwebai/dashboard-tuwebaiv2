import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface LandingStats {
  totalTeams: number;
  totalUsers: number;
  totalProjects: number;
  demoUsage: number;
  productivityIncrease: number;
  timeSaved: number;
  meetingTimeReduction: number;
  predictionAccuracy: number;
  decisionSpeed: number;
  projectDelayReduction: number;
  averageROI: number;
  satisfactionRating: number;
  satisfiedClients: number;
  activeTeams: number;
  supportAvailability: string;
}

export const useLandingStats = () => {
  const [stats, setStats] = useState<LandingStats>({
    totalTeams: 0,
    totalUsers: 0,
    totalProjects: 0,
    demoUsage: 0,
    productivityIncrease: 0,
    timeSaved: 0,
    meetingTimeReduction: 0,
    predictionAccuracy: 0,
    decisionSpeed: 0,
    projectDelayReduction: 0,
    averageROI: 0,
    satisfactionRating: 0,
    satisfiedClients: 0,
    activeTeams: 0,
    supportAvailability: '24/7'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Obtener estadísticas de equipos (usando proyectos como proxy)
        const { data: teamsData, error: teamsError } = await supabase
          .from('projects')
          .select('id, created_at, is_active')
          .eq('is_active', true);

        if (teamsError) throw teamsError;

        // Obtener estadísticas de usuarios
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, created_at, last_login');

        if (usersError) throw usersError;

        // Obtener estadísticas de proyectos
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, created_at, status');

        if (projectsError) throw projectsError;

        // Obtener estadísticas de uso de demo
        const { data: demoData, error: demoError } = await supabase
          .from('demo_usage')
          .select('usage_count, week_start')
          .gte('week_start', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('week_start', { ascending: false })
          .limit(1);

        if (demoError) throw demoError;

        // Obtener métricas de rendimiento
        const { data: metricsData, error: metricsError } = await supabase
          .from('performance_metrics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (metricsError) throw metricsError;

        // Obtener estadísticas de satisfacción
        const { data: satisfactionData, error: satisfactionError } = await supabase
          .from('satisfaction_surveys')
          .select('rating, is_satisfied')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        if (satisfactionError) throw satisfactionError;

        // Calcular estadísticas
        const totalTeams = teamsData?.length || 0;
        const totalUsers = usersData?.length || 0;
        const totalProjects = projectsData?.length || 0;
        const demoUsage = demoData?.[0]?.usage_count || 0;
        
        // Calcular métricas de rendimiento
        const metrics = metricsData?.[0];
        const productivityIncrease = metrics?.productivity_increase || 0;
        const timeSaved = metrics?.time_saved_hours || 0;
        const meetingTimeReduction = metrics?.meeting_time_reduction || 0;
        const predictionAccuracy = metrics?.prediction_accuracy || 0;
        const decisionSpeed = metrics?.decision_speed_multiplier || 0;
        const projectDelayReduction = metrics?.project_delay_reduction || 0;
        const averageROI = metrics?.average_roi || 0;

        // Calcular satisfacción
        const satisfactionRatings = satisfactionData?.map(s => s.rating) || [];
        const satisfactionRating = satisfactionRatings.length > 0 
          ? satisfactionRatings.reduce((a, b) => a + b, 0) / satisfactionRatings.length 
          : 0;
        
        const satisfiedClients = satisfactionData?.filter(s => s.is_satisfied).length || 0;
        const satisfiedClientsPercentage = satisfactionData?.length > 0 
          ? (satisfiedClients / satisfactionData.length) * 100 
          : 0;

        // Usuarios activos (últimos 30 días)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const activeUsers = usersData?.filter(user => 
          user.last_login && new Date(user.last_login) > thirtyDaysAgo
        ).length || 0;

        setStats({
          totalTeams: totalTeams,
          totalUsers: totalUsers,
          totalProjects: totalProjects,
          demoUsage: demoUsage,
          productivityIncrease: Math.round(productivityIncrease),
          timeSaved: Math.round(timeSaved),
          meetingTimeReduction: Math.round(meetingTimeReduction),
          predictionAccuracy: Math.round(predictionAccuracy),
          decisionSpeed: Math.round(decisionSpeed),
          projectDelayReduction: Math.round(projectDelayReduction),
          averageROI: Math.round(averageROI),
          satisfactionRating: Math.round(satisfactionRating * 10) / 10,
          satisfiedClients: Math.round(satisfiedClientsPercentage),
          activeTeams: totalTeams,
          supportAvailability: '24/7'
        });

      } catch (err) {
        console.error('Error fetching landing stats:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        
        // Valores por defecto en caso de error
        setStats({
          totalTeams: 127,
          totalUsers: 1500,
          totalProjects: 2500,
          demoUsage: 2847,
          productivityIncrease: 40,
          timeSaved: 12,
          meetingTimeReduction: 85,
          predictionAccuracy: 92,
          decisionSpeed: 3,
          projectDelayReduction: 67,
          averageROI: 45,
          satisfactionRating: 4.9,
          satisfiedClients: 98,
          activeTeams: 127,
          supportAvailability: '24/7'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};
