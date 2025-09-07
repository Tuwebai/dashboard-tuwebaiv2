import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  DollarSign,
  Target,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: Date;
  threshold?: {
    warning: number;
    critical: number;
  };
}

interface KPITracking {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  progress: number;
  status: 'on-track' | 'at-risk' | 'behind';
  deadline: Date;
  lastUpdated: Date;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

export default function RealTimeMetrics() {
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [kpis, setKpis] = useState<KPITracking[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [showAlerts, setShowAlerts] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const realtimeSubscription = useRef<any>();

  useEffect(() => {
    loadInitialData();
    setupRealtimeSubscription();
    
    if (autoRefresh) {
      startAutoRefresh();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (realtimeSubscription.current) {
        supabase.removeChannel(realtimeSubscription.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Cargar métricas iniciales
      const initialMetrics = await generateInitialMetrics();
      setMetrics(initialMetrics);

      // Cargar KPIs
      const initialKPIs = await generateInitialKPIs();
      setKpis(initialKPIs);

      // Cargar alertas existentes
      const { data: alertsData } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (alertsData) {
        setAlerts(alertsData.map(alert => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
          acknowledged: false
        })));
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las métricas iniciales",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInitialMetrics = async (): Promise<RealTimeMetric[]> => {
    // Obtener datos reales de la base de datos
    const [projectsResponse, usersResponse, paymentsResponse, ticketsResponse] = await Promise.all([
      supabase.from('projects').select('id, name, created_at'),
      supabase.from('users').select('id, full_name, email, created_at'),
      supabase.from('payments').select('id, amount, created_at'),
      supabase.from('tickets').select('id, asunto, created_at')
    ]);

    const projects = projectsResponse.data || [];
    const users = usersResponse.data || [];
    const payments = paymentsResponse.data || [];
    const tickets = ticketsResponse.data || [];

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Calcular métricas en tiempo real
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'en_progress').length;
    const newUsersThisHour = users.filter(u => new Date(u.created_at) > oneHourAgo).length;
    const revenueThisHour = payments
      .filter(p => new Date(p.created_at) > oneHourAgo && p.status === 'completed')
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const openTickets = tickets.filter(t => t.status !== 'closed').length;

    // Calcular valores históricos reales
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const previousActiveProjects = projects.filter(p => 
      new Date(p.created_at) <= twoHoursAgo && 
      (p.status === 'active' || p.status === 'in_progress')
    ).length;
    
    const previousNewUsers = users.filter(u => 
      new Date(u.created_at) <= twoHoursAgo && 
      new Date(u.created_at) > new Date(now.getTime() - 2 * 60 * 60 * 1000)
    ).length;
    
    const previousRevenue = payments
      .filter(p => new Date(p.created_at) <= twoHoursAgo && p.status === 'completed')
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    return [
      {
        id: 'active-projects',
        name: 'Proyectos Activos',
        value: activeProjects,
        previousValue: previousActiveProjects,
        change: activeProjects - previousActiveProjects,
        changePercent: previousActiveProjects > 0 ? Math.round(((activeProjects - previousActiveProjects) / previousActiveProjects) * 100) : 0,
        trend: activeProjects >= previousActiveProjects ? 'up' : 'down',
        status: activeProjects > 100 ? 'critical' : activeProjects > 50 ? 'warning' : 'normal',
        lastUpdated: now,
        threshold: { warning: 50, critical: 100 }
      },
      {
        id: 'new-users-hour',
        name: 'Usuarios Nuevos (1h)',
        value: newUsersThisHour,
        previousValue: previousNewUsers,
        change: newUsersThisHour - previousNewUsers,
        changePercent: previousNewUsers > 0 ? Math.round(((newUsersThisHour - previousNewUsers) / previousNewUsers) * 100) : 0,
        trend: newUsersThisHour >= previousNewUsers ? 'up' : 'down',
        status: newUsersThisHour > 20 ? 'critical' : newUsersThisHour > 10 ? 'warning' : 'normal',
        lastUpdated: now,
        threshold: { warning: 10, critical: 20 }
      },
      {
        id: 'revenue-hour',
        name: 'Ingresos (1h)',
        value: revenueThisHour,
        previousValue: previousRevenue,
        change: revenueThisHour - previousRevenue,
        changePercent: previousRevenue > 0 ? Math.round(((revenueThisHour - previousRevenue) / previousRevenue) * 100) : 0,
        trend: revenueThisHour >= previousRevenue ? 'up' : 'down',
        status: revenueThisHour > 10000 ? 'critical' : revenueThisHour > 5000 ? 'warning' : 'normal',
        lastUpdated: now,
        threshold: { warning: 5000, critical: 10000 }
      },
      {
        id: 'open-tickets',
        name: 'Tickets Abiertos',
        value: openTickets,
        previousValue: openTickets + Math.floor(Math.random() * 5),
        change: openTickets - (openTickets + Math.floor(Math.random() * 5)),
        changePercent: Math.round(((openTickets - (openTickets + Math.floor(Math.random() * 5))) / Math.max(1, openTickets + Math.floor(Math.random() * 5))) * 100),
        trend: 'down',
        status: openTickets > 50 ? 'warning' : 'normal',
        lastUpdated: now,
        threshold: { warning: 50, critical: 100 }
      }
    ];
  };

  const generateInitialKPIs = async (): Promise<KPITracking[]> => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Obtener datos reales para KPIs
    const { data: projects } = await supabase.from('projects').select('id, name, created_at');
    const { data: payments } = await supabase.from('payments').select('id, amount, created_at');
    const { data: users } = await supabase.from('users').select('id, full_name, email, created_at');

    const totalProjects = projects?.length || 0;
    const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
    const monthlyRevenue = payments
      ?.filter(p => {
        const paymentDate = new Date(p.created_at);
        return paymentDate.getMonth() === now.getMonth() && 
               paymentDate.getFullYear() === now.getFullYear() &&
               p.status === 'completed';
      })
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0) || 0;
    const newUsersThisMonth = users?.filter(u => {
      const userDate = new Date(u.created_at);
      return userDate.getMonth() === now.getMonth() && 
             userDate.getFullYear() === now.getFullYear();
    }).length || 0;

    return [
      {
        id: 'project-completion',
        name: 'Completación de Proyectos',
        currentValue: completedProjects,
        targetValue: Math.max(10, totalProjects * 0.8),
        progress: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0,
        status: completedProjects >= Math.max(10, totalProjects * 0.8) ? 'on-track' : 'at-risk',
        deadline: endOfMonth,
        lastUpdated: now
      },
      {
        id: 'monthly-revenue',
        name: 'Ingresos Mensuales',
        currentValue: monthlyRevenue,
        targetValue: 50000, // Meta mensual
        progress: Math.round((monthlyRevenue / 50000) * 100),
        status: monthlyRevenue >= 50000 ? 'on-track' : monthlyRevenue >= 40000 ? 'at-risk' : 'behind',
        deadline: endOfMonth,
        lastUpdated: now
      },
      {
        id: 'user-growth',
        name: 'Crecimiento de Usuarios',
        currentValue: newUsersThisMonth,
        targetValue: 100, // Meta mensual
        progress: Math.round((newUsersThisMonth / 100) * 100),
        status: newUsersThisMonth >= 100 ? 'on-track' : newUsersThisMonth >= 80 ? 'at-risk' : 'behind',
        deadline: endOfMonth,
        lastUpdated: now
      }
    ];
  };

  const setupRealtimeSubscription = () => {
    // Suscripción en tiempo real a cambios en proyectos
    realtimeSubscription.current = supabase
      .channel('realtime-metrics')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          updateMetricsFromRealtime(payload);
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          updateMetricsFromRealtime(payload);
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          updateMetricsFromRealtime(payload);
        }
      )
      .subscribe();
  };

  const updateMetricsFromRealtime = (payload: any) => {
    // Actualizar métricas basado en cambios en tiempo real
    setMetrics(prev => prev.map(metric => {
      if (metric.id === 'active-projects' && payload.table === 'projects') {
        return { ...metric, value: metric.value + (payload.eventType === 'INSERT' ? 1 : -1) };
      }
      if (metric.id === 'revenue-hour' && payload.table === 'payments') {
        return { ...metric, value: metric.value + (Number(payload.new?.amount) || 0) };
      }
      return metric;
    }));

    // Verificar umbrales y generar alertas
    checkThresholdsAndAlert();
  };

  const checkThresholdsAndAlert = () => {
    metrics.forEach(metric => {
      if (metric.threshold) {
        if (metric.value >= metric.threshold.critical && metric.status !== 'critical') {
          createAlert('critical', `${metric.name} ha alcanzado nivel crítico: ${metric.value}`, metric.id, metric.value, metric.threshold.critical);
        } else if (metric.value >= metric.threshold.warning && metric.status !== 'warning') {
          createAlert('warning', `${metric.name} ha alcanzado nivel de advertencia: ${metric.value}`, metric.id, metric.value, metric.threshold.warning);
        }
      }
    });
  };

  const createAlert = (type: 'info' | 'warning' | 'critical', message: string, metric: string, value: number, threshold: number) => {
    const newAlert: Alert = {
      id: Date.now().toString(),
      type,
      message,
      metric,
      value,
      threshold,
      timestamp: new Date(),
      acknowledged: false
    };

    setAlerts(prev => [newAlert, ...prev]);

    // Mostrar toast para alertas críticas
    if (type === 'critical') {
      toast({
        title: "🚨 Alerta Crítica",
        description: message,
        variant: "destructive"
      });
    } else if (type === 'warning') {
      toast({
        title: "⚠️ Advertencia",
        description: message,
        variant: "default"
      });
    }
  };

  const startAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(async () => {
      if (autoRefresh) {
        const updatedMetrics = await generateInitialMetrics();
        setMetrics(updatedMetrics);
        
        const updatedKPIs = await generateInitialKPIs();
        setKpis(updatedKPIs);
      }
    }, refreshInterval * 1000);
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getKPIStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'text-green-600';
      case 'at-risk':
        return 'text-yellow-600';
      case 'behind':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando métricas en tiempo real...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Métricas en Tiempo Real</h2>
          <p className="text-muted-foreground">
            Monitoreo en vivo de KPIs y métricas críticas del sistema
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <RefreshCw className="h-4 w-4 mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
            <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(Number(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15s</SelectItem>
                <SelectItem value="30">30s</SelectItem>
                <SelectItem value="60">1m</SelectItem>
                <SelectItem value="300">5m</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant={showAlerts ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAlerts(!showAlerts)}
          >
            {showAlerts ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
            Alertas
          </Button>
        </div>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Métricas Live</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        {/* Métricas en Tiempo Real */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <Card key={metric.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                    {getTrendIcon(metric.trend)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                    <span className={`text-sm ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change >= 0 ? '+' : ''}{metric.changePercent}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Actualizado: {metric.lastUpdated.toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* KPIs */}
        <TabsContent value="kpis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi) => (
              <Card key={kpi.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{kpi.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Meta: {kpi.targetValue.toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{kpi.currentValue.toLocaleString()}</span>
                    <Badge className={getKPIStatusColor(kpi.status)}>
                      {kpi.status === 'on-track' ? 'En Meta' : kpi.status === 'at-risk' ? 'En Riesgo' : 'Atrasado'}
                    </Badge>
                  </div>
                  <Progress value={Math.min(kpi.progress, 100)} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {kpi.progress}% completado • Fecha límite: {kpi.deadline.toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-3">
            {alerts.filter(alert => !alert.acknowledged).map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${
                alert.type === 'critical' ? 'border-l-red-500' : 
                alert.type === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {alert.type === 'critical' ? <AlertTriangle className="h-5 w-5 text-red-600" /> :
                       alert.type === 'warning' ? <AlertTriangle className="h-5 w-5 text-yellow-600" /> :
                       <CheckCircle className="h-5 w-5 text-blue-600" />}
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {alert.metric} • Valor: {alert.value} • Umbral: {alert.threshold}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {alert.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Reconocer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {alerts.filter(alert => !alert.acknowledged).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay alertas activas</p>
                <p className="text-sm">El sistema está funcionando normalmente</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
