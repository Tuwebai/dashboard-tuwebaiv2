import { supabase } from './supabase';
import { handleSupabaseError } from './errorHandler';

export interface ChartDataPoint {
  name: string;
  value: number;
  x?: number;
  y?: number;
  max?: number;
  color?: string;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar';
  data: ChartDataPoint[];
  title: string;
  description?: string;
}

export class ChartDataService {
  // Obtener datos de usuarios por mes
  async getUserGrowthData(): Promise<ChartDataPoint[]> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar usuarios por mes
      const monthlyData = this.groupDataByMonth(users || [], 'created_at');
      
      return monthlyData.map((item, index) => ({
        name: this.getMonthName(index),
        value: item.count
      }));
    } catch (error) {
      handleSupabaseError(error, 'Obtener datos de crecimiento de usuarios');
      return [];
    }
  }

  // Obtener datos de proyectos por estado
  async getProjectStatusData(): Promise<ChartDataPoint[]> {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('status');

      if (error) throw error;

      // Contar proyectos por estado
      const statusCounts = (projects || []).reduce((acc: Record<string, number>, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(statusCounts).map(([status, count]) => ({
        name: this.getStatusDisplayName(status),
        value: count,
        color: this.getStatusColor(status)
      }));
    } catch (error) {
      handleSupabaseError(error, 'Obtener datos de estado de proyectos');
      return [];
    }
  }

  // Obtener datos de ingresos por mes
  async getRevenueData(): Promise<ChartDataPoint[]> {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, created_at, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar ingresos por mes
      const monthlyData = this.groupDataByMonth(payments || [], 'created_at');
      
      return monthlyData.map((item, index) => ({
        name: this.getMonthName(index),
        value: item.total || 0
      }));
    } catch (error) {
      handleSupabaseError(error, 'Obtener datos de ingresos');
      return [];
    }
  }

  // Obtener datos de tickets por prioridad
  async getTicketPriorityData(): Promise<ChartDataPoint[]> {
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('prioridad');

      if (error) throw error;

      // Contar tickets por prioridad
      const priorityCounts = (tickets || []).reduce((acc: Record<string, number>, ticket) => {
        acc[ticket.prioridad] = (acc[ticket.prioridad] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(priorityCounts).map(([priority, count]) => ({
        name: this.getPriorityDisplayName(priority),
        value: count,
        color: this.getPriorityColor(priority)
      }));
    } catch (error) {
      handleSupabaseError(error, 'Obtener datos de prioridad de tickets');
      return [];
    }
  }

  // Obtener datos de actividad por día de la semana
  async getWeeklyActivityData(): Promise<ChartDataPoint[]> {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('created_at');

      if (error) throw error;

      // Agrupar por día de la semana
      const weeklyData = this.groupDataByDayOfWeek(projects || [], 'created_at');
      
      return weeklyData.map((item, index) => ({
        name: this.getDayName(index),
        value: item.count
      }));
    } catch (error) {
      handleSupabaseError(error, 'Obtener datos de actividad semanal');
      return [];
    }
  }

  // Obtener datos de rendimiento del sistema
  async getSystemPerformanceData(): Promise<ChartDataPoint[]> {
    try {
      // Obtener métricas del sistema
      const [usersCount, projectsCount, ticketsCount, paymentsCount] = await Promise.all([
        this.getCount('users'),
        this.getCount('projects'),
        this.getCount('tickets'),
        this.getCount('payments')
      ]);

      return [
        { name: 'Usuarios', value: usersCount, max: 1000 },
        { name: 'Proyectos', value: projectsCount, max: 500 },
        { name: 'Tickets', value: ticketsCount, max: 200 },
        { name: 'Pagos', value: paymentsCount, max: 100 }
      ];
    } catch (error) {
      handleSupabaseError(error, 'Obtener datos de rendimiento del sistema');
      return [];
    }
  }

  // Métodos auxiliares
  private async getCount(table: string): Promise<number> {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  }

  private groupDataByMonth(data: any[], dateField: string): Array<{ count: number; total?: number }> {
    const monthlyData: Record<string, { count: number; total?: number }> = {};
    
    data.forEach(item => {
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, total: 0 };
      }
      
      monthlyData[monthKey].count++;
      if (item.amount) {
        monthlyData[monthKey].total = (monthlyData[monthKey].total || 0) + item.amount;
      }
    });

    return Object.values(monthlyData);
  }

  private groupDataByDayOfWeek(data: any[], dateField: string): Array<{ count: number }> {
    const weeklyData: Record<number, { count: number }> = {};
    
    data.forEach(item => {
      const date = new Date(item[dateField]);
      const dayOfWeek = date.getDay();
      
      if (!weeklyData[dayOfWeek]) {
        weeklyData[dayOfWeek] = { count: 0 };
      }
      
      weeklyData[dayOfWeek].count++;
    });

    // Asegurar que tenemos datos para todos los días
    const result = [];
    for (let i = 0; i < 7; i++) {
      result.push(weeklyData[i] || { count: 0 });
    }
    
    return result;
  }

  private getMonthName(index: number): string {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[index] || `Mes ${index + 1}`;
  }

  private getDayName(index: number): string {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[index] || `Día ${index}`;
  }

  private getStatusDisplayName(status: string): string {
    const statusMap: Record<string, string> = {
      'active': 'Activos',
      'completed': 'Completados',
      'pending': 'Pendientes',
      'cancelled': 'Cancelados',
      'on_hold': 'En Espera',
      'in_progress': 'En Progreso',
      'development': 'En Desarrollo',
      'production': 'En Producción'
    };
    return statusMap[status] || status;
  }

  private getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'active': '#10B981',
      'completed': '#3B82F6',
      'pending': '#F59E0B',
      'cancelled': '#EF4444',
      'on_hold': '#6B7280',
      'in_progress': '#8B5CF6',
      'development': '#06B6D4',
      'production': '#84CC16'
    };
    return colorMap[status] || '#6B7280';
  }

  private getPriorityDisplayName(priority: string): string {
    const priorityMap: Record<string, string> = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta',
      'critical': 'Crítica',
      'urgent': 'Urgente'
    };
    return priorityMap[priority] || priority;
  }

  private getPriorityColor(priority: string): string {
    const colorMap: Record<string, string> = {
      'low': '#10B981',
      'medium': '#F59E0B',
      'high': '#EF4444',
      'critical': '#DC2626',
      'urgent': '#7C2D12'
    };
    return colorMap[priority] || '#6B7280';
  }
}

export const chartDataService = new ChartDataService();
