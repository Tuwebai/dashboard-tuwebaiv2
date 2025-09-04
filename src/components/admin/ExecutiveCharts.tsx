import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  LineController,
  BarController,
  DoughnutController
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Users, DollarSign, Target, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  LineController,
  BarController,
  DoughnutController
);

interface ChartData {
  userGrowth: {
    labels: string[];
    datasets: any[];
  };
  monthlyRevenue: {
    labels: string[];
    datasets: any[];
  };
  projectDistribution: {
    labels: string[];
    datasets: any[];
  };
  ticketPriority: {
    labels: string[];
    datasets: any[];
  };
  systemActivity: {
    labels: string[];
    datasets: any[];
  };
}

interface ExecutiveChartsProps {
  refreshData: () => void;
  lastUpdate: Date;
}

export default function ExecutiveCharts({ refreshData, lastUpdate }: ExecutiveChartsProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  // Cargar datos reales desde la base de datos
  const loadRealData = async () => {
    try {
      setLoading(true);
      
      // Cargar usuarios
      let { data: users, error: usersError } = await supabase
        .from('users')
        .select('created_at')
        .order('created_at', { ascending: true });
      
      if (usersError) {
        console.error('Error loading users:', usersError);
        users = [];
      }

      // Cargar pagos
      let { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, created_at, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: true });
      
      if (paymentsError) {
        console.error('Error loading payments:', paymentsError);
        payments = [];
      }

      // Cargar proyectos
      let { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('status, created_at')
        .order('created_at', { ascending: true });
      
      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        projects = [];
      }

      // Cargar tickets
      let { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('prioridad, estado, created_at')
        .order('created_at', { ascending: true });
      
      if (ticketsError) {
        console.error('Error loading tickets:', ticketsError);
        // Si hay error con tickets, usar array vacío
        tickets = [];
      }

      // Generar etiquetas de fechas según el rango seleccionado
      const now = new Date();
      const labels = [];
      
      if (timeRange === '7d') {
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
        }
      } else if (timeRange === '30d') {
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
        }
      } else if (timeRange === '90d') {
        for (let i = 89; i >= 0; i -= 3) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
        }
      }

      // Procesar datos de usuarios por fecha
      const userGrowthData = labels.map((label, index) => {
        const targetDate = new Date(now);
        if (timeRange === '7d') {
          targetDate.setDate(targetDate.getDate() - (6 - index));
        } else if (timeRange === '30d') {
          targetDate.setDate(targetDate.getDate() - (29 - index));
        } else if (timeRange === '90d') {
          targetDate.setDate(targetDate.getDate() - (89 - index * 3));
        }
        
        const endDate = new Date(targetDate);
        endDate.setDate(endDate.getDate() + 1);
        
        return (users || []).filter(user => {
          const userDate = new Date(user.created_at);
          return userDate >= targetDate && userDate < endDate;
        }).length || 0;
      });

      // Procesar datos de ingresos por fecha
      const revenueData = labels.map((label, index) => {
        const targetDate = new Date(now);
        if (timeRange === '7d') {
          targetDate.setDate(targetDate.getDate() - (6 - index));
        } else if (timeRange === '30d') {
          targetDate.setDate(targetDate.getDate() - (29 - index));
        } else if (timeRange === '90d') {
          targetDate.setDate(targetDate.getDate() - (89 - index * 3));
        }
        
        const endDate = new Date(targetDate);
        endDate.setDate(endDate.getDate() + 1);
        
        return (payments || []).filter(payment => {
          const paymentDate = new Date(payment.created_at);
          return paymentDate >= targetDate && paymentDate < endDate;
        }).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) || 0;
      });

      // Procesar distribución de proyectos
      const projectStatuses = (projects || []).reduce((acc, project) => {
        const status = project.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const projectLabels = Object.keys(projectStatuses);
      const projectData = Object.values(projectStatuses);

      // Procesar tickets por prioridad
      const ticketPriorities = (tickets || []).reduce((acc, ticket) => {
        const priority = ticket.prioridad || 'unknown';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const ticketLabels = Object.keys(ticketPriorities);
      const ticketData = Object.values(ticketPriorities);

      // Procesar actividad del sistema (última semana)
      const weekLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const weekData = weekLabels.map((_, index) => {
        const targetDate = new Date(now);
        const dayOfWeek = targetDate.getDay();
        const daysToSubtract = dayOfWeek - index;
        targetDate.setDate(targetDate.getDate() - daysToSubtract);
        
        const endDate = new Date(targetDate);
        endDate.setDate(endDate.getDate() + 1);
        
        // Contar actividad (usuarios + proyectos + tickets creados ese día)
        const userActivity = users?.filter(user => {
          const userDate = new Date(user.created_at);
          return userDate >= targetDate && userDate < endDate;
        }).length || 0;

        const projectActivity = projects?.filter(project => {
          const projectDate = new Date(project.created_at);
          return projectDate >= targetDate && projectDate < endDate;
        }).length || 0;

                 const ticketActivity = (tickets || []).filter(ticket => {
           const ticketDate = new Date(ticket.created_at);
           return ticketDate >= targetDate && ticketDate < endDate;
         }).length || 0;

        return userActivity + projectActivity + ticketActivity;
      });

      setChartData({
        userGrowth: {
          labels,
          datasets: [
            {
              label: 'Usuarios Registrados',
              data: userGrowthData.map(val => Math.round(val)), // Asegurar números enteros
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: 'rgb(59, 130, 246)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            }
          ]
        },
        monthlyRevenue: {
          labels,
          datasets: [
            {
              label: 'Ingresos ($)',
              data: revenueData.map(val => Math.round(val)), // Asegurar números enteros
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              borderColor: 'rgb(34, 197, 94)',
              borderWidth: 2,
              borderRadius: 4,
              borderSkipped: false
            }
          ]
        },
        projectDistribution: {
          labels: projectLabels.length > 0 ? projectLabels : ['Sin datos'],
          datasets: [
            {
              data: projectData.length > 0 ? projectData.map(val => Math.round(val)) : [0], // Asegurar números enteros
              backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(251, 191, 36, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(147, 51, 234, 0.8)'
              ],
              borderColor: [
                'rgb(59, 130, 246)',
                'rgb(34, 197, 94)',
                'rgb(251, 191, 36)',
                'rgb(239, 68, 68)',
                'rgb(147, 51, 234)'
              ],
              borderWidth: 2,
              hoverOffset: 4
            }
          ]
        },
        ticketPriority: {
          labels: ticketLabels.length > 0 ? ticketLabels : ['Sin datos'],
          datasets: [
            {
              label: 'Tickets por Prioridad',
              data: ticketData.length > 0 ? ticketData.map(val => Math.round(val)) : [0], // Asegurar números enteros
              backgroundColor: [
                'rgba(239, 68, 68, 0.8)',
                'rgba(251, 191, 36, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(147, 51, 234, 0.8)'
              ],
              borderColor: [
                'rgb(239, 68, 68)',
                'rgb(251, 191, 36)',
                'rgb(59, 130, 246)',
                'rgb(34, 197, 94)',
                'rgb(147, 51, 234)'
              ],
              borderWidth: 2
            }
          ]
        },
        systemActivity: {
          labels: weekLabels,
          datasets: [
            {
              label: 'Actividad del Sistema',
              data: weekData.map(val => Math.round(val)), // Asegurar números enteros
              borderColor: 'rgb(147, 51, 234)',
              backgroundColor: 'rgba(147, 51, 234, 0.1)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: 'rgb(147, 51, 234)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error loading chart data:', error);
      // Si hay error, mostrar gráficos vacíos
      setChartData({
        userGrowth: { labels: [], datasets: [{ label: 'Sin datos', data: [], borderColor: 'rgb(156, 163, 175)', backgroundColor: 'rgba(156, 163, 175, 0.1)' }] },
        monthlyRevenue: { labels: [], datasets: [{ label: 'Sin datos', data: [], backgroundColor: 'rgba(156, 163, 175, 0.8)' }] },
        projectDistribution: { labels: ['Sin datos'], datasets: [{ data: [0], backgroundColor: ['rgba(156, 163, 175, 0.8)'] }] },
        ticketPriority: { labels: ['Sin datos'], datasets: [{ label: 'Sin datos', data: [0], backgroundColor: ['rgba(156, 163, 175, 0.8)'] }] },
        systemActivity: { labels: ['Sin datos'], datasets: [{ label: 'Sin datos', data: [0], borderColor: 'rgb(156, 163, 175)' }] }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, [timeRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#374151', // Texto oscuro para mejor legibilidad
          font: {
            size: 12,
            weight: 'normal'
          },
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#d1d5db',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        }
      }
    },
    scales: {
              x: {
          ticks: {
            color: '#374151', // Texto oscuro para mejor legibilidad
            font: {
              size: 11,
              weight: 'normal'
            },
            maxRotation: 45,
            minRotation: 0
          },
        grid: {
          color: '#e5e7eb', // Gris claro para las líneas de grid
          drawBorder: false
        },
        border: {
          color: '#d1d5db'
        }
      },
              y: {
          ticks: {
            color: '#374151', // Texto oscuro para mejor legibilidad
            font: {
              size: 11,
              weight: 'normal'
            },
            callback: function(value: any) {
              // Convertir a números enteros
              return Math.round(value);
            },
            stepSize: 1, // Forzar incrementos de 1
            beginAtZero: true
          },
        grid: {
          color: '#e5e7eb', // Gris claro para las líneas de grid
          drawBorder: false
        },
        border: {
          color: '#d1d5db'
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2
      },
      line: {
        tension: 0.4
      }
    }
  };

  const doughnutOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        position: 'bottom' as const
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-500">No hay datos disponibles para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Dashboard Ejecutivo</h2>
          <p className="text-slate-600">
            Análisis visual de métricas clave • Última actualización: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-white border-slate-200 text-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refreshData} variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50">
            <TrendingUp className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Gráficos en grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crecimiento de Usuarios */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-slate-800">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Crecimiento de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={chartData.userGrowth} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Ingresos Mensuales */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-slate-800">
              <DollarSign className="h-5 w-5 mr-2 text-green-500" />
              Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={chartData.monthlyRevenue} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Distribución de Proyectos */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-slate-800">
              <Target className="h-5 w-5 mr-2 text-purple-500" />
              Distribución de Proyectos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={chartData.projectDistribution} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Tickets por Prioridad */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-slate-800">
              <Activity className="h-5 w-5 mr-2 text-orange-500" />
              Tickets por Prioridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={chartData.ticketPriority} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Actividad del Sistema (ancho completo) */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-slate-800">
            <Activity className="h-5 w-5 mr-2 text-purple-500" />
            Actividad del Sistema (Última Semana)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={chartData.systemActivity} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
