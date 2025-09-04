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
  Play, 
  Pause, 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Activity,
  GitBranch,
  GitCommit,
  GitPullRequest,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { workflowService } from '@/lib/workflowService';
import { triggerService } from '@/lib/triggerService';
import { automationTaskService } from '@/lib/automationTaskService';
import { supabase } from '@/lib/supabase';

// =====================================================
// COMPONENTE PRINCIPAL DEL SISTEMA DE AUTOMATIZACIÓN
// =====================================================

export default function AutomationSystem() {
  const [activeTab, setActiveTab] = useState('overview');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [automationLogs, setAutomationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  // Estados para formularios
  const [showWorkflowForm, setShowWorkflowForm] = useState(false);
  const [showTriggerForm, setShowTriggerForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadAutomationData();
  }, []);

  // =====================================================
  // CARGA DE DATOS
  // =====================================================

  const loadAutomationData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [workflowsData, triggersData, tasksData, statsData, logsData] = await Promise.all([
        workflowService.getWorkflows(),
        triggerService.getTriggers(),
        automationTaskService.getTasks(),
        getAutomationStats(),
        // Obtener logs reales de automatización
        supabase
          .from('automation_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
          .then(result => result.data || [])
      ]);

      setWorkflows(workflowsData);
      setTriggers(triggersData);
      setTasks(tasksData);
      setStats(statsData);
      setAutomationLogs(logsData);
      
    } catch (error) {
      console.error('Error loading automation data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de automatización',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getAutomationStats = async () => {
    try {
      // Obtener estadísticas reales de la base de datos
      const [workflowsCount, triggersCount, tasksCount, executionsCount] = await Promise.all([
        workflowService.getWorkflows().then(w => w.length),
        triggerService.getTriggers().then(t => t.length),
        automationTaskService.getTasks().then(t => t.length),
        // Contar ejecuciones de workflows
        supabase
          .from('workflow_executions')
          .select('id', { count: 'exact' })
          .then(result => result.count || 0)
      ]);

      // Calcular tasa de éxito basada en ejecuciones completadas vs fallidas
      const { data: executionStats } = await supabase
        .from('workflow_executions')
        .select('status')
        .in('status', ['completed', 'failed']);

      const completed = executionStats?.filter(e => e.status === 'completed').length || 0;
      const failed = executionStats?.filter(e => e.status === 'failed').length || 0;
      const total = completed + failed;
      const success_rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Obtener logs reales de automatización
      const { data: automationLogs } = await supabase
        .from('automation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      return {
        workflows: workflowsCount,
        triggers: triggersCount,
        tasks: tasksCount,
        executions: executionsCount,
        success_rate,
        logs: automationLogs || []
      };
    } catch (error) {
      console.error('Error getting automation stats:', error);
      return {
        workflows: 0,
        triggers: 0,
        tasks: 0,
        executions: 0,
        success_rate: 0,
        logs: []
      };
    }
  };

  // =====================================================
  // FUNCIONES DE ACTUALIZACIÓN
  // =====================================================

  const refreshData = async () => {
    await loadAutomationData();
    toast({
      title: 'Actualizado',
      description: 'Datos de automatización actualizados'
    });
  };

  // =====================================================
  // RENDERIZADO DEL COMPONENTE
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Sistema de Automatización</h1>
          <p className="text-slate-600">
            Gestiona workflows, triggers y tareas automatizadas del sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
           <Button 
            onClick={loadAutomationData}
             variant="outline" 
             size="sm"
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
           >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
           </Button>
          <Button
            onClick={() => setShowWorkflowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Workflow
          </Button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <CardTitle className="text-sm font-medium text-slate-700">Workflows Activos</CardTitle>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-800">{stats.workflows || 0}</div>
              <p className="text-xs text-slate-500">Flujos de trabajo automatizados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <CardTitle className="text-sm font-medium text-slate-700">Triggers Activos</CardTitle>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-800">{stats.triggers || 0}</div>
              <p className="text-xs text-slate-500">Eventos automáticos configurados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <CardTitle className="text-sm font-medium text-slate-700">Tareas Programadas</CardTitle>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-800">{stats.tasks || 0}</div>
              <p className="text-xs text-slate-500">Tareas automatizadas activas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <CardTitle className="text-sm font-medium text-slate-700">Tasa de Éxito</CardTitle>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-800">{stats.success_rate?.toFixed(1) || 0}%</div>
              <p className="text-xs text-slate-500">Ejecuciones exitosas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap w-full bg-white border border-slate-200 gap-1 p-1 rounded-lg shadow-sm">
          <TabsTrigger 
            value="overview" 
            className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
          >
             Resumen
           </TabsTrigger>
          <TabsTrigger 
            value="workflows" 
            className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
          >
             Workflows
           </TabsTrigger>
          <TabsTrigger 
            value="triggers" 
            className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
          >
             Triggers
           </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
          >
             Tareas
           </TabsTrigger>
          <TabsTrigger 
            value="logs" 
            className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
          >
              Logs
            </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
          >
            Configuración
          </TabsTrigger>
         </TabsList>

        {/* Tab de Resumen */}
        <TabsContent value="overview" className="space-y-6">
          {/* Actividad Reciente */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Actividad Reciente</CardTitle>
              <CardDescription className="text-slate-600">
                Últimas ejecuciones y eventos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {automationLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No hay actividad reciente</p>
                  <p className="text-slate-400 text-sm mt-2">
                    Los logs aparecerán aquí cuando se ejecuten automatizaciones
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {automationLogs.slice(0, 5).map((workflow: any) => (
                    <div key={workflow.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-slate-800 font-medium">{workflow.name}</p>
                          <p className="text-slate-500 text-sm">
                            {workflow.description || 'Sin descripción'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          {new Date(workflow.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {triggers.slice(0, 3).map((trigger: any) => (
                    <div key={trigger.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-slate-800 font-medium">{trigger.name}</p>
                          <p className="text-slate-500 text-sm">
                            {trigger.description || 'Sin descripción'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          {new Date(trigger.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {tasks.slice(0, 3).map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div>
                          <p className="text-slate-800 font-medium">{task.name}</p>
                          <p className="text-slate-500 text-sm">
                            {task.description || 'Sin descripción'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          {new Date(task.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rendimiento del Sistema */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Rendimiento del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">{stats.tasks || 0}</div>
                  <span className="text-slate-600">Tareas Activas</span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">{stats.triggers || 0}</div>
                  <span className="text-slate-600">Triggers Activos</span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">{stats.workflows || 0}</div>
                  <span className="text-slate-600">Workflows Activos</span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">{stats.success_rate?.toFixed(1) || 0}%</div>
                  <span className="text-slate-600">Tasa de Éxito</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próximas Ejecuciones */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Próximas Ejecuciones</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.filter((task: any) => task.next_execution).length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No hay tareas programadas</p>
                  <p className="text-slate-400 text-sm mt-2">
                    Las tareas programadas aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks
                    .filter((task: any) => task.next_execution)
                    .slice(0, 5)
                    .map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <div>
                          <p className="text-slate-800 text-sm">{task.name}</p>
                          <p className="text-slate-500 text-xs">
                            {task.description || 'Sin descripción'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">
                            {new Date(task.next_execution).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Workflows */}
         <TabsContent value="workflows" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Workflows de Proyectos</h2>
            <Button
              onClick={() => setShowWorkflowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Workflow
            </Button>
          </div>

          {workflows.length === 0 ? (
            <Card className="bg-white border-slate-200">
              <CardContent className="text-center py-8">
                <GitBranch className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">No hay workflows configurados</p>
                <p className="text-slate-400 text-sm mt-2">
                  Crea tu primer workflow para automatizar procesos
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((workflow: any) => (
                <Card key={workflow.id} className="bg-white border-slate-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-800">{workflow.name}</CardTitle>
                      <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                        {workflow.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <CardDescription className="text-slate-600">
                      {workflow.description || 'Sin descripción'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Tipo:</span>
                      <span className="text-slate-700">{workflow.project_type || 'General'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Creado:</span>
                      <span className="text-slate-700">
                        {new Date(workflow.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Ejecuciones:</span>
                      <span className="text-slate-700">{workflow.execution_count || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
         </TabsContent>

        {/* Tab de Triggers */}
         <TabsContent value="triggers" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Triggers del Sistema</h2>
            <Button
              onClick={() => setShowTriggerForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Trigger
            </Button>
          </div>

          {triggers.length === 0 ? (
            <Card className="bg-white border-slate-200">
              <CardContent className="text-center py-8">
                <GitPullRequest className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">No hay triggers configurados</p>
                <p className="text-slate-400 text-sm mt-2">
                  Crea triggers para automatizar acciones en eventos específicos
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {triggers.map((trigger: any) => (
                <Card key={trigger.id} className="bg-white border-slate-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-800">{trigger.name}</h3>
                      <Badge variant={trigger.status === 'active' ? 'default' : 'secondary'}>
                        {trigger.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 mb-3">
                      {trigger.description || 'Sin descripción'}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Evento:</span>
                        <p className="text-slate-700">{trigger.event_type}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ejecuciones:</span>
                        <p className="text-slate-700">{trigger.trigger_count}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Última:</span>
                        <p className="text-slate-700">
                          {trigger.last_triggered 
                            ? new Date(trigger.last_triggered).toLocaleDateString()
                            : 'Nunca'
                          }
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Creado:</span>
                        <p className="text-slate-700">
                          {new Date(trigger.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
         </TabsContent>

        {/* Tab de Tareas */}
         <TabsContent value="tasks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Tareas Automatizadas</h2>
            <Button
              onClick={() => setShowTaskForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>

          {tasks.length === 0 ? (
            <Card className="bg-white border-slate-200">
              <CardContent className="text-center py-8">
                <GitCommit className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">No hay tareas automatizadas configuradas</p>
                <p className="text-slate-400 text-sm mt-2">
                  Crea tareas para ejecutar scripts y procesos automáticamente
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task: any) => (
                <Card key={task.id} className="bg-white border-slate-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-800">{task.name}</h3>
                      <Badge variant={task.status === 'active' ? 'default' : 'secondary'}>
                        {task.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 mb-3">
                      {task.description || 'Sin descripción'}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tipo:</span>
                        <p className="text-slate-700">{task.script_type}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Frecuencia:</span>
                        <p className="text-slate-700">{task.frequency}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Última:</span>
                        <p className="text-slate-700">
                          {task.last_executed 
                            ? new Date(task.last_executed).toLocaleDateString()
                            : 'Nunca'
                          }
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Próxima:</span>
                        <p className="text-slate-700">
                          {task.next_execution 
                            ? new Date(task.next_execution).toLocaleDateString()
                            : 'No programada'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
         </TabsContent>

        {/* Tab de Logs */}
         <TabsContent value="logs" className="space-y-6">
           <LogsTab />
         </TabsContent>
      </Tabs>

      {/* Formularios Modales */}
      {showWorkflowForm && (
        <WorkflowForm 
          onClose={() => setShowWorkflowForm(false)}
          onSuccess={() => {
            setShowWorkflowForm(false);
            loadAutomationData();
          }}
        />
      )}

      {showTriggerForm && (
        <TriggerForm 
          onClose={() => setShowTriggerForm(false)}
          onSuccess={() => {
            setShowTriggerForm(false);
            loadAutomationData();
          }}
        />
      )}

      {showTaskForm && (
        <TaskForm 
          onClose={() => setShowTaskForm(false)}
          onSuccess={() => {
            setShowTaskForm(false);
            loadAutomationData();
          }}
        />
      )}
    </div>
  );
}

// =====================================================
// COMPONENTES DE PESTAÑAS
// =====================================================

// Pestaña de Resumen
function OverviewTab({ workflows, triggers, tasks, stats }: any) {
  return (
    <div className="space-y-6">
             {/* Actividad Reciente */}
       <Card className="bg-white border-slate-200">
         <CardHeader>
           <CardTitle className="text-slate-800">Actividad Reciente</CardTitle>
           <CardDescription className="text-slate-600">
             Últimas ejecuciones y eventos del sistema
           </CardDescription>
         </CardHeader>
         <CardContent>
           {workflows.length === 0 && triggers.length === 0 && tasks.length === 0 ? (
             <div className="text-center py-8">
               <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
               <p className="text-slate-500">No hay actividad reciente</p>
               <p className="text-slate-400 text-sm mt-2">
                 Crea workflows, triggers o tareas para ver actividad
               </p>
             </div>
           ) : (
             <div className="space-y-4">
               {workflows.slice(0, 3).map((workflow) => (
                 <div key={workflow.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                   <div className="flex items-center space-x-3">
                     <GitBranch className="h-5 w-5 text-blue-500" />
                     <div>
                       <p className="text-slate-800 font-medium">{workflow.name}</p>
                       <p className="text-slate-500 text-sm">
                         Creado {new Date(workflow.created_at).toLocaleDateString()}
                       </p>
                     </div>
                   </div>
                   <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                     {workflow.is_active ? 'Activo' : 'Inactivo'}
                   </Badge>
                 </div>
               ))}
               
               {triggers.slice(0, 2).map((trigger) => (
                 <div key={trigger.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                   <div className="flex items-center space-x-3">
                     <GitPullRequest className="h-5 w-5 text-green-500" />
                     <div>
                       <p className="text-slate-800 font-medium">{trigger.name}</p>
                       <p className="text-slate-500 text-sm">
                         {trigger.event_type} • {trigger.trigger_count || 0} ejecuciones
                       </p>
                     </div>
                   </div>
                   <Badge variant={trigger.is_active ? 'default' : 'secondary'}>
                     {trigger.is_active ? 'Activo' : 'Inactivo'}
                   </Badge>
                 </div>
               ))}
               
               {tasks.slice(0, 2).map((task) => (
                 <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                   <div className="flex items-center space-x-3">
                     <GitCommit className="h-5 w-5 text-yellow-500" />
                     <div>
                       <p className="text-slate-800 font-medium">{task.name}</p>
                       <p className="text-slate-500 text-sm">
                         {task.type} • {task.run_count || 0} ejecuciones
                       </p>
                     </div>
                   </div>
                   <Badge variant={task.is_active ? 'default' : 'secondary'}>
                     {task.is_active ? 'Activa' : 'Inactiva'}
                   </Badge>
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>

      {/* Métricas de Rendimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Rendimiento del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Tareas Activas</span>
                <Badge variant="secondary">{stats.tasks || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Triggers Activos</span>
                <Badge variant="secondary">{stats.triggers || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Workflows Activos</span>
                <Badge variant="secondary">{stats.workflows || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Tasa de Éxito</span>
                <Badge variant="default">{stats.success_rate?.toFixed(1) || 0}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

                 <Card className="bg-white border-slate-200 shadow-sm">
           <CardHeader>
             <CardTitle className="text-slate-800">Próximas Ejecuciones</CardTitle>
           </CardHeader>
           <CardContent>
             {tasks.filter(task => task.next_run && task.is_active).length === 0 ? (
               <div className="text-center py-8">
                 <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                 <p className="text-slate-600">No hay tareas programadas</p>
                 <p className="text-slate-500 text-sm mt-2">
                   Crea tareas automatizadas para ver programaciones
                 </p>
               </div>
             ) : (
               <div className="space-y-4">
                 {tasks
                   .filter(task => task.next_run && task.is_active)
                   .slice(0, 5)
                   .map((task) => (
                     <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                       <div>
                         <p className="text-slate-800 text-sm font-medium">{task.name}</p>
                         <p className="text-slate-500 text-xs">
                           {task.next_run ? new Date(task.next_run).toLocaleDateString() : 'No programada'}
                         </p>
                       </div>
                       <Clock className="h-4 w-4 text-yellow-500" />
                     </div>
                   ))}
               </div>
             )}
           </CardContent>
         </Card>
      </div>
    </div>
  );
}

// Pestaña de Workflows
function WorkflowsTab({ workflows, onRefresh, onShowWorkflowForm, onDeleteWorkflow }: any) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);

  const executeWorkflow = async (workflowId: string, projectId: string) => {
    try {
      await workflowService.executeWorkflow(projectId, workflowId);
      toast({
        title: 'Éxito',
        description: 'Workflow ejecutado correctamente'
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo ejecutar el workflow',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
             <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-800">Workflows de Proyectos</h2>
         <Button 
           onClick={onShowWorkflowForm} 
           className="bg-blue-600 hover:bg-blue-700"
         >
           <Plus className="h-4 w-4 mr-2" />
           Nuevo Workflow
         </Button>
       </div>

      {workflows.length === 0 ? (
                <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="text-center py-8">
            <GitBranch className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No hay workflows configurados</p>
            <p className="text-slate-500 text-sm mt-2">
              Crea tu primer workflow para automatizar procesos de proyectos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-800">{workflow.name}</CardTitle>
                  <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                    {workflow.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <CardDescription className="text-slate-600">
                  {workflow.description || 'Sin descripción'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tipo:</span>
                    <span className="text-slate-800">{workflow.project_type || 'General'}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Creado:</span>
                    <span className="text-slate-800">
                      {new Date(workflow.created_at).toLocaleDateString()}
                    </span>
                  </div>

                                     <div className="flex space-x-2">
                     <Button 
                       size="sm" 
                       variant="outline"
                       onClick={() => executeWorkflow(workflow.id, 'demo-project')}
                     >
                       <Play className="h-4 w-4 mr-1" />
                       Ejecutar
                     </Button>
                     <Button 
                       size="sm" 
                       variant="destructive"
                       onClick={() => onDeleteWorkflow(workflow.id)}
                     >
                       <Trash2 className="h-4 w-4 mr-1" />
                       Eliminar
                     </Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Pestaña de Triggers
function TriggersTab({ triggers, onRefresh, onShowTriggerForm, onDeleteTrigger }: any) {
  const toggleTrigger = async (triggerId: string, isActive: boolean) => {
    try {
      await triggerService.toggleTrigger(triggerId, isActive);
      toast({
        title: 'Éxito',
        description: `Trigger ${isActive ? 'activado' : 'desactivado'} correctamente`
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado del trigger',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
             <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-800">Triggers del Sistema</h2>
         <Button 
           onClick={onShowTriggerForm}
           className="bg-green-600 hover:bg-green-700"
         >
           <Plus className="h-4 w-4 mr-2" />
           Nuevo Trigger
         </Button>
       </div>

      {triggers.length === 0 ? (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="text-center py-8">
                         <GitPullRequest className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No hay triggers configurados</p>
            <p className="text-slate-500 text-sm mt-2">
              Crea triggers para automatizar acciones basadas en eventos del sistema
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {triggers.map((trigger) => (
            <Card key={trigger.id} className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">{trigger.name}</h3>
                      <Badge variant={trigger.is_active ? 'default' : 'secondary'}>
                        {trigger.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    
                    <p className="text-slate-600 mb-3">
                      {trigger.description || 'Sin descripción'}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Evento:</span>
                        <p className="text-slate-800">{trigger.event_type}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Ejecuciones:</span>
                        <p className="text-slate-800">{trigger.trigger_count}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Última:</span>
                        <p className="text-slate-800">
                          {trigger.last_triggered ? 
                            new Date(trigger.last_triggered).toLocaleDateString() : 
                            'Nunca'
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-600">Creado:</span>
                        <p className="text-slate-800">
                          {new Date(trigger.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                                         <Button 
                       size="sm" 
                       variant={trigger.is_active ? 'destructive' : 'default'}
                       onClick={() => toggleTrigger(trigger.id, !trigger.is_active)}
                     >
                       {trigger.is_active ? (
                         <>
                           <Pause className="h-4 w-4 mr-1" />
                           Pausar
                         </>
                       ) : (
                         <>
                           <Play className="h-4 w-4 mr-1" />
                           Activar
                         </>
                       )}
                     </Button>
                     
                                           <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onDeleteTrigger(trigger.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Pestaña de Tareas
function TasksTab({ tasks, onRefresh, onShowTaskForm, onDeleteTask }: any) {
  const executeTask = async (taskId: string) => {
    try {
      await automationTaskService.executeTask(taskId);
      toast({
        title: 'Éxito',
        description: 'Tarea ejecutada correctamente'
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo ejecutar la tarea',
        variant: 'destructive'
      });
    }
  };

  const toggleTask = async (taskId: string, isActive: boolean) => {
    try {
      await automationTaskService.toggleTask(taskId, isActive);
      toast({
        title: 'Éxito',
        description: `Tarea ${isActive ? 'activada' : 'desactivada'} correctamente`
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado de la tarea',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
             <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Tareas Automatizadas</h2>
         <Button 
           onClick={onShowTaskForm}
          className="bg-blue-600 hover:bg-blue-700 text-white"
         >
           <Plus className="h-4 w-4 mr-2" />
           Nueva Tarea
         </Button>
       </div>

      {tasks.length === 0 ? (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="text-center py-8">
            <GitCommit className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">No hay tareas automatizadas configuradas</p>
            <p className="text-slate-400 text-sm mt-2">
              Crea tareas para automatizar procesos del sistema
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id} className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">{task.name}</h3>
                      <Badge variant={task.is_active ? 'default' : 'secondary'}>
                        {task.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <Badge variant="outline" className="border-slate-300 text-slate-700">
                        {task.type}
                      </Badge>
                    </div>
                    <p className="text-slate-600 mb-3">
                      {task.description || 'Sin descripción'}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Tipo:</span>
                        <p className="text-slate-700 font-medium">{task.script_type}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Frecuencia:</span>
                        <p className="text-slate-700 font-medium">{task.frequency}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Última:</span>
                        <p className="text-slate-700 font-medium">
                          {task.last_executed 
                            ? new Date(task.last_executed).toLocaleDateString()
                            : 'Nunca'
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Próxima:</span>
                        <p className="text-slate-700 font-medium">
                          {task.next_execution 
                            ? new Date(task.next_execution).toLocaleDateString()
                            : 'No programada'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button 
                      size="sm" 
                      onClick={() => executeTask(task.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Ejecutar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => toggleTask(task.id, !task.is_active)}
                      className="border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      {task.is_active ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Activar
                        </>
                      )}
                    </Button>
                                         <Button 
                       size="sm" 
                       variant="destructive"
                       onClick={() => onDeleteTask(task.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                     >
                       <Trash2 className="h-4 w-4 mr-1" />
                       Eliminar
                     </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Pestaña de Logs
function LogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('automation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Éxito</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Advertencia</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-200">Info</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-slate-600">Cargando logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Logs de Automatización</h2>
        <Button
          onClick={loadLogs}
          variant="outline"
          className="border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {logs.length === 0 ? (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="text-center py-8">
            <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">No hay logs de automatización</p>
            <p className="text-slate-400 text-sm mt-2">
              Los logs aparecerán aquí cuando se ejecuten automatizaciones
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getStatusIcon(log.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-slate-800 font-medium">{log.workflow_name || 'Sistema'}</h3>
                        {getStatusBadge(log.status)}
                      </div>
                      <p className="text-slate-600 text-sm mb-2">
                        {log.message || 'Sin mensaje'}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span>ID: {log.id}</span>
                        <span>Tipo: {log.type || 'N/A'}</span>
                        <span>Duración: {log.duration || 'N/A'}ms</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// FORMULARIOS MODALES
// =====================================================

// Formulario de Workflow
function WorkflowForm({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: 'web_development',
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Error',
          description: 'El nombre del workflow es obligatorio',
          variant: 'destructive'
        });
        return;
      }

      const newWorkflow = await workflowService.createWorkflow({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        project_type: formData.project_type,
        is_active: formData.is_active
      });

      toast({
        title: 'Éxito',
        description: `Workflow "${newWorkflow.name}" creado correctamente`
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error creating workflow:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el workflow',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-white border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-800">Nuevo Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-700">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white border-slate-200 text-slate-800"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-slate-700">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white border-slate-200 text-slate-800"
              />
            </div>
            
            <div>
              <Label htmlFor="project_type" className="text-slate-700">Tipo de Proyecto</Label>
              <Select
                value={formData.project_type}
                onValueChange={(value) => setFormData({ ...formData, project_type: value })}
              >
                <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="web_development">Desarrollo Web</SelectItem>
                  <SelectItem value="mobile_app">Aplicación Móvil</SelectItem>
                  <SelectItem value="desktop_app">Aplicación de Escritorio</SelectItem>
                  <SelectItem value="api_service">Servicio API</SelectItem>
                  <SelectItem value="database">Base de Datos</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className="text-slate-700">Activo</Label>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                Crear Workflow
              </Button>
              <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Formulario de Trigger
function TriggerForm({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_type: 'project_created' as any,
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Error',
          description: 'El nombre del trigger es obligatorio',
          variant: 'destructive'
        });
        return;
      }

      const newTrigger = await triggerService.createTrigger({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        event_type: formData.event_type,
        is_active: formData.is_active
      });

      toast({
        title: 'Éxito',
        description: `Trigger "${newTrigger.name}" creado correctamente`
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error creating trigger:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el trigger',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-white border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-800">Nuevo Trigger</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-700">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white border-slate-200 text-slate-800"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-slate-700">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white border-slate-200 text-slate-800"
              />
            </div>
            
            <div>
              <Label htmlFor="event_type" className="text-slate-700">Tipo de Evento</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              >
                <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                  <SelectValue placeholder="Seleccionar evento" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="project_created">Proyecto Creado</SelectItem>
                  <SelectItem value="project_updated">Proyecto Actualizado</SelectItem>
                  <SelectItem value="user_registered">Usuario Registrado</SelectItem>
                  <SelectItem value="payment_received">Pago Recibido</SelectItem>
                  <SelectItem value="ticket_created">Ticket Creado</SelectItem>
                  <SelectItem value="file_uploaded">Archivo Subido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className="text-slate-700">Activo</Label>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                Crear Trigger
              </Button>
              <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Formulario de Tarea
function TaskForm({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'daily' as 'daily' | 'weekly' | 'monthly' | 'on_event' | 'custom',
    script: '',
    script_type: 'javascript' as 'javascript' | 'sql' | 'shell',
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name.trim() || !formData.script.trim()) {
        toast({
          title: 'Error',
          description: 'El nombre y el script son obligatorios',
          variant: 'destructive'
        });
        return;
      }

      const newTask = await automationTaskService.createTask({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        script: formData.script.trim(),
        script_type: formData.script_type,
        is_active: formData.is_active
      });

      toast({
        title: 'Éxito',
        description: `Tarea "${newTask.name}" creada correctamente`
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la tarea',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-white border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-800">Nueva Tarea Automatizada</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-700">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white border-slate-200 text-slate-800"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-slate-700">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white border-slate-200 text-slate-800"
              />
            </div>
            
            <div>
              <Label htmlFor="type" className="text-slate-700">Tipo de Ejecución</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'on_event' | 'custom') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="daily">Diaria</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="on_event">Por Evento</SelectItem>
                  <SelectItem value="custom">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="script_type" className="text-slate-700">Tipo de Script</Label>
              <Select
                value={formData.script_type}
                onValueChange={(value: 'javascript' | 'sql' | 'shell') => setFormData({ ...formData, script_type: value })}
              >
                <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="shell">Shell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="script" className="text-slate-700">Script</Label>
              <Textarea
                id="script"
                value={formData.script}
                onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                className="bg-white border-slate-200 text-slate-800 min-h-[100px]"
                placeholder="Escribe tu script aquí..."
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className="text-slate-700">Activa</Label>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                Crear Tarea
              </Button>
              <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
