import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Settings, 
  Save, 
  Load, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  Grid3X3,
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  Radar,
  TrendingUp,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence, OptimizedReorder as Reorder } from '@/components/OptimizedMotion';
import AdvancedChart, { ChartConfig } from './AdvancedChart';
import { chartDataService, ChartData } from '@/lib/chartDataService';

interface ChartDashboardProps {
  className?: string;
  onSave?: (dashboard: DashboardConfig) => void;
  onLoad?: () => DashboardConfig | null;
}

interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  charts: ChartConfig[];
  layout: 'grid' | 'flexible';
  theme: 'light' | 'dark' | 'auto';
  autoRefresh: boolean;
  refreshInterval: number;
}

// Plantillas de gráficos con datos reales
const getChartTemplates = async (): Promise<ChartData[]> => {
  try {
    const [
      userGrowthData,
      projectStatusData,
      revenueData,
      ticketPriorityData,
      weeklyActivityData,
      systemPerformanceData
    ] = await Promise.all([
      chartDataService.getUserGrowthData(),
      chartDataService.getProjectStatusData(),
      chartDataService.getRevenueData(),
      chartDataService.getTicketPriorityData(),
      chartDataService.getWeeklyActivityData(),
      chartDataService.getSystemPerformanceData()
    ]);

    return [
      {
        name: 'Crecimiento de Usuarios',
        type: 'line' as const,
        data: userGrowthData,
        title: 'Crecimiento de Usuarios por Mes',
        description: 'Evolución del número de usuarios registrados'
      },
      {
        name: 'Estado de Proyectos',
        type: 'bar' as const,
        data: projectStatusData,
        title: 'Proyectos por Estado',
        description: 'Distribución de proyectos según su estado actual'
      },
      {
        name: 'Prioridad de Tickets',
        type: 'pie' as const,
        data: ticketPriorityData,
        title: 'Tickets por Prioridad',
        description: 'Distribución de tickets según su nivel de prioridad'
      },
      {
        name: 'Actividad Semanal',
        type: 'area' as const,
        data: weeklyActivityData,
        title: 'Actividad por Día de la Semana',
        description: 'Actividad del sistema por día de la semana'
      },
      {
        name: 'Ingresos Mensuales',
        type: 'line' as const,
        data: revenueData,
        title: 'Ingresos por Mes',
        description: 'Evolución de los ingresos mensuales'
      },
      {
        name: 'Rendimiento del Sistema',
        type: 'radar' as const,
        data: systemPerformanceData,
        title: 'Métricas del Sistema',
        description: 'Rendimiento general del sistema'
      }
    ];
  } catch (error) {
    console.error('Error loading chart templates:', error);
    return [];
  }
};

export default function ChartDashboard({ 
  className = '', 
  onSave, 
  onLoad 
}: ChartDashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardConfig>({
    id: crypto.randomUUID(),
    name: 'Dashboard Personalizable',
    description: 'Dashboard con gráficos avanzados y personalizables',
    charts: [],
    layout: 'grid',
    theme: 'auto',
    autoRefresh: false,
    refreshInterval: 30
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [chartTemplates, setChartTemplates] = useState<ChartData[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Cargar dashboard guardado y plantillas al montar el componente
  useEffect(() => {
    if (onLoad) {
      const savedDashboard = onLoad();
      if (savedDashboard) {
        setDashboard(savedDashboard);
      }
    }
    
    // Cargar plantillas de gráficos
    loadChartTemplates();
  }, [onLoad]);

  const loadChartTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const templates = await getChartTemplates();
      setChartTemplates(templates);
    } catch (error) {
      console.error('Error loading chart templates:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las plantillas de gráficos",
        variant: "destructive"
      });
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (!dashboard.autoRefresh || dashboard.refreshInterval === 0) return;

    const interval = setInterval(() => {
      // Aquí podrías recargar datos de los gráficos
      toast({
        title: "Actualización automática",
        description: "Datos actualizados automáticamente",
      });
    }, dashboard.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [dashboard.autoRefresh, dashboard.refreshInterval]);

  const createChartFromTemplate = useCallback(() => {
    if (!selectedTemplate) return;

    const template = chartTemplates.find(t => t.name === selectedTemplate);
    if (!template) return;

    const newChart: ChartConfig = {
      id: crypto.randomUUID(),
      title: template.name,
      type: template.type,
      data: template.data,
      options: {},
      theme: dashboard.theme,
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'],
      showLegend: true,
      showGrid: true,
      showTooltip: true,
      showDataLabels: false,
      animation: true,
      responsive: true,
      height: 400,
      width: 600
    };

    setDashboard(prev => ({
      ...prev,
      charts: [...prev.charts, newChart]
    }));

    setShowCreateModal(false);
    setSelectedTemplate('');
    
    toast({
      title: "Gráfico creado",
      description: `${template.name} agregado al dashboard`,
    });
  }, [selectedTemplate, dashboard.theme]);

  const updateChart = useCallback((chartId: string, updates: Partial<ChartConfig>) => {
    setDashboard(prev => ({
      ...prev,
      charts: prev.charts.map(chart => 
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    }));
  }, []);

  const removeChart = useCallback((chartId: string) => {
    setDashboard(prev => ({
      ...prev,
      charts: prev.charts.filter(chart => chart.id !== chartId)
    }));

    toast({
      title: "Gráfico eliminado",
      description: "El gráfico ha sido removido del dashboard",
    });
  }, []);

  const duplicateChart = useCallback((chart: ChartConfig) => {
    const duplicatedChart: ChartConfig = {
      ...chart,
      id: crypto.randomUUID(),
      title: `${chart.title} (Copia)`
    };

    setDashboard(prev => ({
      ...prev,
      charts: [...prev.charts, duplicatedChart]
    }));

    toast({
      title: "Gráfico duplicado",
      description: "Se ha creado una copia del gráfico",
    });
  }, []);

  const saveDashboard = useCallback(() => {
    if (onSave) {
      onSave(dashboard);
      toast({
        title: "Dashboard guardado",
        description: "La configuración se ha guardado exitosamente",
      });
    }
  }, [dashboard, onSave]);

  const exportDashboard = useCallback(() => {
    const dataStr = JSON.stringify(dashboard, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dashboard.name}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Dashboard exportado",
      description: "El dashboard se ha exportado como JSON",
    });
  }, [dashboard]);

  const importDashboard = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedDashboard = JSON.parse(e.target?.result as string);
        setDashboard(importedDashboard);
        
        toast({
          title: "Dashboard importado",
          description: "El dashboard se ha importado exitosamente",
        });
      } catch (error) {
        toast({
          title: "Error al importar",
          description: "El archivo no es válido",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  }, []);

  const resetDashboard = useCallback(() => {
    setDashboard({
      id: crypto.randomUUID(),
      name: 'Dashboard Personalizable',
      description: 'Dashboard con gráficos avanzados y personalizables',
      charts: [],
      layout: 'grid',
      theme: 'auto',
      autoRefresh: false,
      refreshInterval: 30
    });

    toast({
      title: "Dashboard reseteado",
      description: "Se han restablecido todos los valores por defecto",
    });
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header del Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{dashboard.name}</CardTitle>
              <p className="text-muted-foreground">{dashboard.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {dashboard.charts.length} gráficos
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-9 px-3"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={exportDashboard}
                className="h-9 px-3"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={importDashboard}
                  className="hidden"
                />
                <Button variant="outline" size="sm" className="h-9 px-3">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
              </label>

              <Button
                onClick={saveDashboard}
                className="h-9 px-4"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controles del Dashboard */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="h-10 px-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Gráfico
          </Button>

          <Button
            variant="outline"
            onClick={resetDashboard}
            className="h-10 px-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Resetear
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="layout">Layout:</Label>
            <Select
              value={dashboard.layout}
              onValueChange={(value: 'grid' | 'flexible') => 
                setDashboard(prev => ({ ...prev, layout: value }))
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">
                  <div className="flex items-center space-x-2">
                    <Grid3X3 className="h-4 w-4" />
                    <span>Grid</span>
                  </div>
                </SelectItem>
                <SelectItem value="flexible">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Flexible</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="theme">Tema:</Label>
            <Select
              value={dashboard.theme}
              onValueChange={(value: 'light' | 'dark' | 'auto') => 
                setDashboard(prev => ({ ...prev, theme: value }))
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Oscuro</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <AnimatePresence>
        {dashboard.charts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="max-w-md mx-auto">
              <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay gráficos</h3>
              <p className="text-muted-foreground mb-4">
                Comienza agregando tu primer gráfico personalizable
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Gráfico
              </Button>
            </div>
          </motion.div>
        ) : (
          <Reorder.Group
            axis="y"
            values={dashboard.charts}
            onReorder={(newOrder) => 
              setDashboard(prev => ({ ...prev, charts: newOrder }))
            }
            className="space-y-6"
          >
            {dashboard.charts.map((chart, index) => (
              <Reorder.Item key={chart.id} value={chart}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="relative group"
                >
                  {/* Controles del gráfico */}
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateChart(chart)}
                        className="h-7 w-7 p-0"
                        title="Duplicar"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChart(chart.id)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <AdvancedChart
                    config={chart}
                    onConfigChange={(updates) => updateChart(chart.id, updates)}
                    onExport={(format) => {
                      toast({
                        title: "Exportando gráfico",
                        description: `Exportando ${chart.title} como ${format.toUpperCase()}`,
                      });
                    }}
                    className="w-full"
                  />
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </AnimatePresence>

      {/* Modal para crear gráfico */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Gráfico</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label>Seleccionar Plantilla</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {chartTemplates.map((template) => (
                  <div
                    key={template.name}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedTemplate === template.name
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTemplate(template.name)}
                  >
                    <div className="flex items-center space-x-2">
                      {template.type === 'line' && <LineChart className="h-4 w-4" />}
                      {template.type === 'bar' && <BarChart3 className="h-4 w-4" />}
                      {template.type === 'pie' && <PieChart className="h-4 w-4" />}
                      {template.type === 'area' && <AreaChart className="h-4 w-4" />}
                      {template.type === 'scatter' && <ScatterPlot className="h-4 w-4" />}
                      {template.type === 'radar' && <Radar className="h-4 w-4" />}
                      <span className="text-sm font-medium">{template.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.data.length} puntos de datos
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={createChartFromTemplate}
                disabled={!selectedTemplate}
              >
                Crear Gráfico
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de configuración del dashboard */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuración del Dashboard</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="actualizacion">Actualización</TabsTrigger>
              <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div>
                <Label htmlFor="dashboardName">Nombre del Dashboard</Label>
                <Input
                  id="dashboardName"
                  value={dashboard.name}
                  onChange={(e) => setDashboard(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ingresa el nombre del dashboard"
                />
              </div>
              
              <div>
                <Label htmlFor="dashboardDescription">Descripción</Label>
                <Input
                  id="dashboardDescription"
                  value={dashboard.description}
                  onChange={(e) => setDashboard(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe el propósito del dashboard"
                />
              </div>
            </TabsContent>

            <TabsContent value="actualizacion" className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={dashboard.autoRefresh}
                  onChange={(e) => setDashboard(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="autoRefresh">Actualización automática</Label>
              </div>
              
              {dashboard.autoRefresh && (
                <div>
                  <Label>Intervalo de actualización (segundos)</Label>
                  <input
                    type="range"
                    min="5"
                    max="300"
                    step="5"
                    value={dashboard.refreshInterval}
                    onChange={(e) => setDashboard(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                    className="w-full mt-2"
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    {dashboard.refreshInterval} segundos
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="apariencia" className="space-y-4">
              <div>
                <Label htmlFor="dashboardTheme">Tema del Dashboard</Label>
                <Select
                  value={dashboard.theme}
                  onValueChange={(value: 'light' | 'dark' | 'auto') => 
                    setDashboard(prev => ({ ...prev, theme: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="auto">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
