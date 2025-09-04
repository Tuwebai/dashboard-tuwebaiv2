import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Globe,
  Users,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Filter,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { notificationAnalyticsService } from '@/lib/notificationAnalyticsService';
import { AnalyticsSummary, ChannelPerformance, CategoryPerformance, TimeSeriesData, NotificationInsights } from '@/lib/notificationAnalyticsService';

// =====================================================
// INTERFACES
// =====================================================

interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  channels: string[];
  categories: string[];
  groupBy: 'day' | 'week' | 'month';
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function NotificationAnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [insights, setInsights] = useState<NotificationInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días atrás
    endDate: new Date().toISOString().split('T')[0], // Hoy
    channels: [],
    categories: [],
    groupBy: 'day'
  });

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  // =====================================================
  // MÉTODOS PRINCIPALES
  // =====================================================

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const [summaryData, channelData, categoryData, timeSeries, insightsData] = await Promise.all([
        notificationAnalyticsService.getAnalyticsSummary(filters),
        notificationAnalyticsService.getChannelPerformance(filters),
        notificationAnalyticsService.getCategoryPerformance(filters),
        notificationAnalyticsService.getTimeSeriesData(filters),
        notificationAnalyticsService.getNotificationInsights(filters)
      ]);

      setSummary(summaryData);
      setChannelPerformance(channelData);
      setCategoryPerformance(categoryData);
      setTimeSeriesData(timeSeries);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (updates: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const exportAnalytics = () => {
    const data = {
      summary,
      channelPerformance,
      categoryPerformance,
      timeSeriesData,
      insights,
      filters,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // =====================================================
  // RENDERIZADO
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando analytics...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics de Notificaciones</h1>
          <p className="text-muted-foreground mt-2">
            Métricas y insights del sistema de notificaciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Fecha Inicio</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilters({ startDate: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha Fin</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilters({ endDate: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Agrupar por</label>
              <Select
                value={filters.groupBy}
                onValueChange={(groupBy) => updateFilters({ groupBy: groupBy as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Día</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadAnalytics} className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen General */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Enviadas</p>
                  <p className="text-2xl font-bold">{summary.totalSent.toLocaleString()}</p>
                </div>
                <Mail className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tasa de Entrega</p>
                  <p className="text-2xl font-bold">{summary.deliveryRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tasa de Apertura</p>
                  <p className="text-2xl font-bold">{summary.openRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tasa de Clics</p>
                  <p className="text-2xl font-bold">{summary.clickRate.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Insights y Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Rendimiento</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mejor Canal:</span>
                    <Badge variant="outline">{insights.bestPerformingChannel}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mejor Categoría:</span>
                    <Badge variant="outline">{insights.bestPerformingCategory}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hora Pico:</span>
                    <Badge variant="outline">{insights.peakSendingTime}</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Tendencias</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Entrega:</span>
                    <div className="flex items-center gap-1">
                      {insights.trends.deliveryRate === 'increasing' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : insights.trends.deliveryRate === 'decreasing' ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <div className="h-4 w-4 bg-gray-400 rounded-full" />
                      )}
                      <span className="text-sm capitalize">{insights.trends.deliveryRate}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Apertura:</span>
                    <div className="flex items-center gap-1">
                      {insights.trends.openRate === 'increasing' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : insights.trends.openRate === 'decreasing' ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <div className="h-4 w-4 bg-gray-400 rounded-full" />
                      )}
                      <span className="text-sm capitalize">{insights.trends.openRate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {insights.recommendations.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Recomendaciones</h3>
                <div className="space-y-2">
                  {insights.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="channels">Canales</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Tab de Resumen */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de líneas - Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Evolución Temporal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sent" stroke="#8884d8" name="Enviadas" />
                    <Line type="monotone" dataKey="delivered" stroke="#82ca9d" name="Entregadas" />
                    <Line type="monotone" dataKey="opened" stroke="#ffc658" name="Abiertas" />
                    <Line type="monotone" dataKey="clicked" stroke="#ff7300" name="Clics" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de barras - Canales */}
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={channelPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="deliveryRate" fill="#8884d8" name="Tasa de Entrega" />
                    <Bar dataKey="openRate" fill="#82ca9d" name="Tasa de Apertura" />
                    <Bar dataKey="clickRate" fill="#ffc658" name="Tasa de Clics" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Canales */}
        <TabsContent value="channels" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {channelPerformance.map((channel) => (
              <Card key={channel.channel}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getChannelIcon(channel.channel)}
                    <span className="capitalize">{channel.channel}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Enviadas</p>
                        <p className="text-2xl font-bold">{channel.sent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Entregadas</p>
                        <p className="text-2xl font-bold">{channel.delivered.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Abiertas</p>
                        <p className="text-2xl font-bold">{channel.opened.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Clics</p>
                        <p className="text-2xl font-bold">{channel.clicked.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Tasa de Entrega</span>
                        <span className="text-sm font-medium">{channel.deliveryRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(channel.deliveryRate, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm">Tasa de Apertura</span>
                        <span className="text-sm font-medium">{channel.openRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(channel.openRate, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm">Tasa de Clics</span>
                        <span className="text-sm font-medium">{channel.clickRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(channel.clickRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab de Categorías */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {categoryPerformance.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getCategoryIcon(category.category)}
                    <span className="capitalize">{category.category}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Enviadas</p>
                        <p className="text-2xl font-bold">{category.sent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Entregadas</p>
                        <p className="text-2xl font-bold">{category.delivered.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Abiertas</p>
                        <p className="text-2xl font-bold">{category.opened.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Clics</p>
                        <p className="text-2xl font-bold">{category.clicked.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Tasa de Entrega</span>
                        <span className="text-sm font-medium">{category.deliveryRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(category.deliveryRate, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm">Tasa de Apertura</span>
                        <span className="text-sm font-medium">{category.openRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(category.openRate, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm">Tasa de Clics</span>
                        <span className="text-sm font-medium">{category.clickRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(category.clickRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab de Timeline */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline Detallado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sent" stroke="#8884d8" name="Enviadas" strokeWidth={2} />
                  <Line type="monotone" dataKey="delivered" stroke="#82ca9d" name="Entregadas" strokeWidth={2} />
                  <Line type="monotone" dataKey="opened" stroke="#ffc658" name="Abiertas" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicked" stroke="#ff7300" name="Clics" strokeWidth={2} />
                  <Line type="monotone" dataKey="failed" stroke="#ff0000" name="Fallidas" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'email':
      return <Mail className="h-5 w-5" />;
    case 'push':
      return <Smartphone className="h-5 w-5" />;
    case 'sms':
      return <MessageSquare className="h-5 w-5" />;
    case 'in_app':
      return <Globe className="h-5 w-5" />;
    default:
      return <BarChart3 className="h-5 w-5" />;
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'system':
      return <BarChart3 className="h-5 w-5" />;
    case 'project':
      return <Users className="h-5 w-5" />;
    case 'ticket':
      return <MessageSquare className="h-5 w-5" />;
    case 'payment':
      return <Target className="h-5 w-5" />;
    case 'security':
      return <AlertCircle className="h-5 w-5" />;
    case 'user':
      return <Users className="h-5 w-5" />;
    default:
      return <BarChart3 className="h-5 w-5" />;
  }
};

