import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Plus, 
  X, 
  Move, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign,
  Calendar,
  Clock,
  Target,
  Activity,
  Save,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { userPreferencesService, DashboardLayout } from '@/lib/userPreferencesService';
import { reportService } from '@/lib/reportService';

interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'list';
  title: string;
  description?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: {
    dataSource?: string;
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    metrics?: string[];
    refreshInterval?: number;
    showLegend?: boolean;
    showGrid?: boolean;
  };
  visible: boolean;
}

interface CustomDashboardLayout {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
}

const DEFAULT_WIDGETS: Widget[] = [
  {
    id: 'projects-overview',
    type: 'metric',
    title: 'Resumen de Proyectos',
    description: 'Métricas generales de proyectos',
    position: { x: 0, y: 0 },
    size: { width: 3, height: 2 },
    config: {
      metrics: ['total', 'active', 'completed'],
      refreshInterval: 300
    },
    visible: true
  },
  {
    id: 'revenue-chart',
    type: 'chart',
    title: 'Ingresos Mensuales',
    description: 'Gráfico de ingresos por mes',
    position: { x: 3, y: 0 },
    size: { width: 6, height: 4 },
    config: {
      dataSource: 'revenue',
      chartType: 'line',
      showLegend: true,
      showGrid: true
    },
    visible: true
  },
  {
    id: 'user-activity',
    type: 'chart',
    title: 'Actividad de Usuarios',
    description: 'Actividad por hora del día',
    position: { x: 0, y: 2 },
    size: { width: 4, height: 3 },
    config: {
      dataSource: 'userActivity',
      chartType: 'area',
      showLegend: false,
      showGrid: true
    },
    visible: true
  },
  {
    id: 'recent-projects',
    type: 'list',
    title: 'Proyectos Recientes',
    description: 'Lista de proyectos recientes',
    position: { x: 4, y: 2 },
    size: { width: 5, height: 3 },
    config: {
      dataSource: 'recentProjects',
      refreshInterval: 60
    },
    visible: true
  }
];

const WIDGET_TYPES = [
  { value: 'metric', label: 'Métricas', icon: <Target className="h-4 w-4" /> },
  { value: 'chart', label: 'Gráfico', icon: <BarChart3 className="h-4 w-4" /> },
  { value: 'table', label: 'Tabla', icon: <FileText className="h-4 w-4" /> },
  { value: 'list', label: 'Lista', icon: <Users className="h-4 w-4" /> }
];

const CHART_TYPES = [
  { value: 'line', label: 'Línea' },
  { value: 'bar', label: 'Barras' },
  { value: 'pie', label: 'Circular' },
  { value: 'area', label: 'Área' }
];

const DATA_SOURCES = [
  { value: 'projects', label: 'Proyectos' },
  { value: 'users', label: 'Usuarios' },
  { value: 'revenue', label: 'Ingresos' },
  { value: 'tasks', label: 'Tareas' },
  { value: 'userActivity', label: 'Actividad de Usuarios' },
  { value: 'recentProjects', label: 'Proyectos Recientes' }
];

export default function CustomizableDashboard() {
  const { user, isAuthenticated } = useApp();
  const [layouts, setLayouts] = useState<CustomDashboardLayout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<CustomDashboardLayout | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [layoutsLoaded, setLayoutsLoaded] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [newWidget, setNewWidget] = useState<Partial<Widget>>({});

  useEffect(() => {
    loadDashboardLayouts();
  }, []);

  const loadDashboardLayouts = async () => {
    if (isAuthenticated && user && !layoutsLoaded) {
      try {
        const userLayouts = await userPreferencesService.getDashboardLayouts(user.id);
        if (userLayouts.length > 0) {
          setLayouts(userLayouts);
          const defaultLayout = userLayouts.find((l: CustomDashboardLayout) => l.isDefault);
          setCurrentLayout(defaultLayout || userLayouts[0]);
        } else {
          // Crear layout por defecto
          const defaultLayout: CustomDashboardLayout = {
            id: 'default',
            name: 'Dashboard Principal',
            description: 'Dashboard por defecto',
            widgets: DEFAULT_WIDGETS,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDefault: true
          };
          setLayouts([defaultLayout]);
          setCurrentLayout(defaultLayout);
          await saveDashboardLayouts([defaultLayout]);
        }
        setLayoutsLoaded(true);
      } catch (error) {
        console.error('Error loading dashboard layouts:', error);
        setLayoutsLoaded(true);
      }
    } else if (!isAuthenticated) {
      // Fallback a localStorage
      try {
        const saved = localStorage.getItem('dashboardLayouts');
        if (saved) {
          const parsed = JSON.parse(saved);
          setLayouts(parsed);
          const defaultLayout = parsed.find((l: CustomDashboardLayout) => l.isDefault);
          setCurrentLayout(defaultLayout || parsed[0]);
        } else {
          // Crear layout por defecto
          const defaultLayout: CustomDashboardLayout = {
            id: 'default',
            name: 'Dashboard Principal',
            description: 'Dashboard por defecto',
            widgets: DEFAULT_WIDGETS,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDefault: true
          };
          setLayouts([defaultLayout]);
          setCurrentLayout(defaultLayout);
          saveDashboardLayouts([defaultLayout]);
        }
        setLayoutsLoaded(true);
      } catch (error) {
        console.error('Error loading dashboard layouts from localStorage:', error);
        setLayoutsLoaded(true);
      }
    }
  };

  const saveDashboardLayouts = async (layoutsToSave: CustomDashboardLayout[]) => {
    try {
      // Guardar en localStorage como fallback
      localStorage.setItem('dashboardLayouts', JSON.stringify(layoutsToSave));
      
      // Guardar en base de datos si el usuario está autenticado
      if (isAuthenticated && user) {
        await userPreferencesService.saveDashboardLayouts(user.id, layoutsToSave);
      }
    } catch (error) {
      console.error('Error saving dashboard layouts:', error);
    }
  };

  const createNewLayout = () => {
    const newLayout: CustomDashboardLayout = {
      id: `layout-${Date.now()}`,
      name: 'Nuevo Dashboard',
      description: 'Dashboard personalizado',
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false
    };
    
    const updatedLayouts = [...layouts, newLayout];
    setLayouts(updatedLayouts);
    setCurrentLayout(newLayout);
    saveDashboardLayouts(updatedLayouts);
    
    toast({
      title: 'Dashboard creado',
      description: 'Se ha creado un nuevo dashboard personalizado'
    });
  };

  const addWidget = () => {
    if (!currentLayout || !newWidget.type || !newWidget.title) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive'
      });
      return;
    }

    const widget: Widget = {
      id: `widget-${Date.now()}`,
      type: newWidget.type as Widget['type'],
      title: newWidget.title,
      description: newWidget.description,
      position: { x: 0, y: 0 },
      size: { width: 3, height: 2 },
      config: {
        dataSource: newWidget.config?.dataSource,
        chartType: newWidget.config?.chartType,
        metrics: newWidget.config?.metrics,
        refreshInterval: newWidget.config?.refreshInterval,
        showLegend: newWidget.config?.showLegend,
        showGrid: newWidget.config?.showGrid
      },
      visible: true
    };

    const updatedLayout = {
      ...currentLayout,
      widgets: [...currentLayout.widgets, widget],
      updatedAt: new Date().toISOString()
    };

    const updatedLayouts = layouts.map(l => 
      l.id === currentLayout.id ? updatedLayout : l
    );

    setCurrentLayout(updatedLayout);
    setLayouts(updatedLayouts);
    saveDashboardLayouts(updatedLayouts);
    setNewWidget({});
    setShowAddWidget(false);

    toast({
      title: 'Widget agregado',
      description: 'Se ha agregado el widget al dashboard'
    });
  };

  const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
    if (!currentLayout) return;

    const updatedWidgets = currentLayout.widgets.map(w =>
      w.id === widgetId ? { ...w, ...updates } : w
    );

    const updatedLayout = {
      ...currentLayout,
      widgets: updatedWidgets,
      updatedAt: new Date().toISOString()
    };

    const updatedLayouts = layouts.map(l =>
      l.id === currentLayout.id ? updatedLayout : l
    );

    setCurrentLayout(updatedLayout);
    setLayouts(updatedLayouts);
    saveDashboardLayouts(updatedLayouts);
  };

  const removeWidget = (widgetId: string) => {
    if (!currentLayout) return;

    const updatedWidgets = currentLayout.widgets.filter(w => w.id !== widgetId);
    const updatedLayout = {
      ...currentLayout,
      widgets: updatedWidgets,
      updatedAt: new Date().toISOString()
    };

    const updatedLayouts = layouts.map(l =>
      l.id === currentLayout.id ? updatedLayout : l
    );

    setCurrentLayout(updatedLayout);
    setLayouts(updatedLayouts);
    saveDashboardLayouts(updatedLayouts);

    toast({
      title: 'Widget eliminado',
      description: 'Se ha eliminado el widget del dashboard'
    });
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    updateWidget(widgetId, { visible: !currentLayout?.widgets.find(w => w.id === widgetId)?.visible });
  };

  const exportDashboard = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!currentLayout) return;

    try {
      const filename = `dashboard-${currentLayout.name.toLowerCase().replace(/\s+/g, '-')}`;
      
      if (format === 'pdf') {
        await reportService.exportDashboardAsPDF('dashboard-container', currentLayout.name);
      } else {
        // Crear reporte con datos del dashboard
        const reportData = reportService.generateProjectReport([]);
        
        if (format === 'excel') {
          reportService.exportToExcel(reportData, filename);
        } else {
          reportService.exportToCSV(reportData, filename);
        }
      }

      toast({
        title: 'Dashboard exportado',
        description: `Se ha exportado el dashboard en formato ${format.toUpperCase()}`
      });
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      toast({
        title: 'Error',
        description: 'No se pudo exportar el dashboard',
        variant: 'destructive'
      });
    }
  };

  const renderWidget = (widget: Widget) => {
    if (!widget.visible) return null;

    const widgetType = WIDGET_TYPES.find(wt => wt.value === widget.type);
    const chartType = widget.config.chartType ? CHART_TYPES.find(ct => ct.value === widget.config.chartType) : null;

    return (
      <Card
        key={widget.id}
        className={`relative ${editMode ? 'border-2 border-dashed border-blue-300' : ''}`}
        style={{
          gridColumn: `span ${widget.size.width}`,
          gridRow: `span ${widget.size.height}`
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {widgetType?.icon}
              <CardTitle className="text-sm">{widget.title}</CardTitle>
            </div>
            {editMode && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleWidgetVisibility(widget.id)}
                >
                  {widget.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingWidget(widget)}
                >
                  <Settings className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWidget(widget.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          {widget.description && (
            <p className="text-xs text-muted-foreground">{widget.description}</p>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {widget.type === 'metric' && (
            <div className="space-y-2">
              <div className="text-2xl font-bold">156</div>
              <div className="text-sm text-muted-foreground">Proyectos totales</div>
            </div>
          )}
          {widget.type === 'chart' && (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Gráfico: {chartType?.label}</p>
                <p className="text-xs">Datos: {widget.config.dataSource}</p>
              </div>
            </div>
          )}
          {widget.type === 'list' && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Proyectos recientes</div>
              <div className="text-xs text-muted-foreground">Lista de elementos</div>
            </div>
          )}
          {widget.type === 'table' && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Tabla de datos</div>
              <div className="text-xs text-muted-foreground">Datos tabulares</div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!currentLayout) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{currentLayout.name}</h1>
          <p className="text-muted-foreground">{currentLayout.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={currentLayout.id}
            onValueChange={(value) => {
              const layout = layouts.find(l => l.id === value);
              if (layout) setCurrentLayout(layout);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {layouts.map(layout => (
                <SelectItem key={layout.id} value={layout.id}>
                  {layout.name} {layout.isDefault && '(Por defecto)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => setEditMode(!editMode)}>
            <Settings className="h-4 w-4 mr-2" />
            {editMode ? 'Vista' : 'Editar'}
          </Button>
          
          <Button variant="outline" onClick={createNewLayout}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo
          </Button>
          
          <Button onClick={() => exportDashboard('pdf')}>
            <Save className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div
        id="dashboard-container"
        className="grid grid-cols-12 gap-4 auto-rows-min"
        style={{ minHeight: '600px' }}
      >
        {currentLayout.widgets.map(renderWidget)}
      </div>

      {/* Add Widget Dialog */}
      <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="widget-type">Tipo de Widget</Label>
              <Select value={newWidget.type} onValueChange={(value) => setNewWidget({ ...newWidget, type: value as Widget['type'] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {WIDGET_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="widget-title">Título</Label>
              <Input
                id="widget-title"
                value={newWidget.title || ''}
                onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value })}
                placeholder="Título del widget"
              />
            </div>
            
            <div>
              <Label htmlFor="widget-description">Descripción</Label>
              <Input
                id="widget-description"
                value={newWidget.description || ''}
                onChange={(e) => setNewWidget({ ...newWidget, description: e.target.value })}
                placeholder="Descripción opcional"
              />
            </div>
            
            {newWidget.type === 'chart' && (
              <>
                <div>
                  <Label htmlFor="data-source">Fuente de Datos</Label>
                  <Select value={newWidget.config?.dataSource} onValueChange={(value) => setNewWidget({ ...newWidget, config: { ...newWidget.config, dataSource: value } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar fuente" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_SOURCES.map(source => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="chart-type">Tipo de Gráfico</Label>
                  <Select value={newWidget.config?.chartType} onValueChange={(value) => setNewWidget({ ...newWidget, config: { ...newWidget.config, chartType: value as any } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHART_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddWidget(false)}>
                Cancelar
              </Button>
              <Button onClick={addWidget}>
                Agregar Widget
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Widget Dialog */}
      {editingWidget && (
        <Dialog open={!!editingWidget} onOpenChange={() => setEditingWidget(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Widget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={editingWidget.title}
                  onChange={(e) => setEditingWidget({ ...editingWidget, title: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Descripción</Label>
                <Input
                  id="edit-description"
                  value={editingWidget.description || ''}
                  onChange={(e) => setEditingWidget({ ...editingWidget, description: e.target.value })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-visible"
                  checked={editingWidget.visible}
                  onCheckedChange={(checked) => setEditingWidget({ ...editingWidget, visible: checked })}
                />
                <Label htmlFor="edit-visible">Visible</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingWidget(null)}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  updateWidget(editingWidget.id, editingWidget);
                  setEditingWidget(null);
                }}>
                  Guardar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Widget Button */}
      {editMode && (
        <div className="fixed bottom-6 right-6">
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg"
            onClick={() => setShowAddWidget(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
} 
