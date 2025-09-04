import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Wrench, 
  Settings, 
  Code, 
  Database, 
  Shield, 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Activity,
  GitBranch,
  BarChart3,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// =====================================================
// COMPONENTE DE HERRAMIENTAS AVANZADAS PARA ADMIN
// =====================================================

export default function AdvancedTools() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  // Estados para formularios
  const [showToolForm, setShowToolForm] = useState(false);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [newTool, setNewTool] = useState({
    name: '',
    script: '',
    script_type: 'javascript',
    status: 'active'
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    loadAdvancedToolsData();
  }, []);

  // =====================================================
  // CARGA DE DATOS
  // =====================================================

  const loadAdvancedToolsData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [toolsData, logsData, statsData] = await Promise.all([
        getAdvancedTools(),
        getSystemLogs(),
        getToolsStats()
      ]);

      setTools(toolsData);
      setLogs(logsData);
      setStats(statsData);
      
    } catch (error) {
      console.error('Error loading advanced tools data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de herramientas avanzadas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getAdvancedTools = async () => {
    try {
      // Usar tabla automation_tasks que sí existe en lugar de admin_tools
      const { data, error } = await supabase
        .from('automation_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting advanced tools:', error);
      return [];
    }
  };

  const getSystemLogs = async () => {
    try {
      // Usar tabla automation_logs que sí existe en lugar de system_logs
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting system logs:', error);
      return [];
    }
  };

  const getToolsStats = async () => {
    try {
      const [toolsCount, logsCount, activeTools] = await Promise.all([
        getAdvancedTools().then(t => t.length),
        getSystemLogs().then(l => l.length),
        getAdvancedTools().then(t => t.filter(tool => tool.status === 'active' || tool.status === 'running').length)
      ]);

      return {
        totalTools: toolsCount,
        totalLogs: logsCount,
        activeTools,
        lastUpdate: new Date().toLocaleString()
      };
    } catch (error) {
      console.error('Error getting tools stats:', error);
      return {};
    }
  };

  // =====================================================
  // FUNCIONES DE GESTIÓN
  // =====================================================

  const createTool = async (toolData: any) => {
    try {
      const { error } = await supabase
        .from('automation_tasks')
        .insert([{
          ...toolData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: 'Herramienta creada',
        description: 'La herramienta avanzada se creó correctamente'
      });

      loadAdvancedToolsData();
      setShowToolForm(false);
      setNewTool({ name: '', script: '', script_type: 'javascript', status: 'active' });
    } catch (error) {
      console.error('Error creating tool:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la herramienta',
        variant: 'destructive'
      });
    }
  };

  const updateTool = async (toolId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('automation_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', toolId);

      if (error) throw error;

      toast({
        title: 'Herramienta actualizada',
        description: 'La herramienta se actualizó correctamente'
      });

      loadAdvancedToolsData();
      setSelectedTool(null);
    } catch (error) {
      console.error('Error updating tool:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la herramienta',
        variant: 'destructive'
      });
    }
  };

  const deleteTool = async (toolId: string) => {
    try {
      const { error } = await supabase
        .from('automation_tasks')
        .delete()
        .eq('id', toolId);

      if (error) throw error;

      toast({
        title: 'Herramienta eliminada',
        description: 'La herramienta se eliminó correctamente'
      });

      loadAdvancedToolsData();
    } catch (error) {
      console.error('Error deleting tool:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la herramienta',
        variant: 'destructive'
      });
    }
  };

  // =====================================================
  // RENDERIZADO
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando herramientas avanzadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Herramientas Avanzadas</h1>
          <p className="text-slate-600">
            Gestión de herramientas y utilidades del sistema
          </p>
        </div>
        <Button onClick={() => setShowToolForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Herramienta
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Total Herramientas</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalTools || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-slate-500">Herramientas Activas</p>
                <p className="text-2xl font-bold text-slate-800">{stats.activeTools || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-slate-500">Total Logs</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalLogs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-slate-500">Última Actualización</p>
                <p className="text-sm font-medium text-slate-800">{stats.lastUpdate || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 border-slate-200">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="tools">Herramientas</TabsTrigger>
          <TabsTrigger value="logs">Logs del Sistema</TabsTrigger>
        </TabsList>

        {/* Vista General */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Resumen del Sistema</CardTitle>
              <CardDescription className="text-slate-600">
                Estado general de las herramientas avanzadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-800">Herramientas Disponibles</p>
                      <p className="text-sm text-slate-600">
                        {stats.totalTools || 0} herramientas configuradas
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-slate-300 text-slate-700">
                    {stats.activeTools || 0} activas
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-slate-800">Estado del Sistema</p>
                      <p className="text-sm text-slate-600">
                        Todas las herramientas funcionando correctamente
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    Operativo
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Herramientas */}
        <TabsContent value="tools" className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Lista de Herramientas</CardTitle>
              <CardDescription className="text-slate-600">
                Gestiona las herramientas avanzadas del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tools.map((tool) => (
                  <div key={tool.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-slate-800">{tool.name}</p>
                        <p className="text-sm text-slate-600">{tool.description || tool.script_type || 'Sin descripción'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={tool.status === 'active' || tool.status === 'running' ? 'default' : 'secondary'}>
                        {tool.status === 'active' || tool.status === 'running' ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTool(tool)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTool(tool.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs del Sistema */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Logs del Sistema</CardTitle>
              <CardDescription className="text-slate-600">
                Registro de actividades y eventos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-white">
                    <div className={`w-2 h-2 rounded-full ${
                      log.status === 'error' ? 'bg-red-500' :
                      log.status === 'warning' ? 'bg-yellow-500' :
                      log.status === 'success' ? 'bg-green-500' :
                      log.status === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{log.message || log.action || 'Sin mensaje'}</p>
                      <p className="text-xs text-slate-600">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs border-slate-300 text-slate-700">
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para crear nueva herramienta */}
      <Dialog open={showToolForm} onOpenChange={setShowToolForm}>
        <DialogContent className="bg-white border-slate-200" aria-describedby="advanced-tools-description">
                      <DialogHeader>
              <DialogTitle className="text-slate-800">Nueva Herramienta Avanzada</DialogTitle>
              <p id="advanced-tools-description" className="text-slate-600 text-sm">
                Crea una nueva herramienta avanzada para el sistema
              </p>
            </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-700">Nombre</Label>
              <Input
                id="name"
                value={newTool.name}
                onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                placeholder="Nombre de la herramienta"
                className="bg-white border-slate-200 text-slate-800"
              />
            </div>

            <div>
              <Label htmlFor="script_type" className="text-slate-700">Tipo de Script</Label>
              <Select
                value={newTool.script_type}
                onValueChange={(value) => setNewTool({ ...newTool, script_type: value })}
              >
                <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="bash">Bash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="script" className="text-slate-700">Script</Label>
              <Textarea
                id="script"
                value={newTool.script}
                onChange={(e) => setNewTool({ ...newTool, script: e.target.value })}
                placeholder="Código de la herramienta"
                className="bg-white border-slate-200 text-slate-800"
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowToolForm(false)}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => createTool(newTool)}
                disabled={!newTool.name || !newTool.script}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Crear Herramienta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
