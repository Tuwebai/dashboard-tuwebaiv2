import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BarChart3, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Settings,
  Bell,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { automationService, Report, Task, UserSkill } from '@/lib/automationService';
import { reportService, ReportData } from '@/lib/reportService';
import { supabase } from '@/lib/supabase';

interface AutomationStats {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  critical_tasks: number;
  completion_rate: number;
}

interface SkillGap {
  skill_name: string;
  required_count: number;
  available_count: number;
  gap_percentage: number;
}

export const AutomationDashboard: React.FC = () => {
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Cargar estadísticas generales
      const { data: statsData, error: statsError } = await supabase
        .from('automation_dashboard')
        .select('*')
        .single();

      if (!statsError && statsData) {
        setStats(statsData);
      }

      // Cargar reportes recientes
      const { data: reportsData, error: reportsError } = await supabase
        .from('automation_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(5);

      if (!reportsError && reportsData) {
        setReports(reportsData);
      }

      // Cargar análisis de skills real
      const { data: skillData, error: skillError } = await supabase
        .from('user_skills')
        .select('skill_name, user_id')
        .not('skill_name', 'is', null);

      if (!skillError && skillData) {
        // Agrupar skills por nombre y contar usuarios
        const skillCounts = skillData.reduce((acc: any, skill: any) => {
          if (!acc[skill.skill_name]) {
            acc[skill.skill_name] = 0;
          }
          acc[skill.skill_name]++;
          return acc;
        }, {});

        // Calcular gaps de skills basado en tareas que requieren skills
        const { data: taskSkillsData } = await supabase
          .from('tasks')
          .select('required_skills')
          .not('required_skills', 'is', null);

        const requiredSkills: any = {};
        if (taskSkillsData) {
          taskSkillsData.forEach((task: any) => {
            if (task.required_skills && Array.isArray(task.required_skills)) {
              task.required_skills.forEach((skill: string) => {
                requiredSkills[skill] = (requiredSkills[skill] || 0) + 1;
              });
            }
          });
        }

        const gaps: SkillGap[] = Object.keys(skillCounts).map(skillName => {
          const available = skillCounts[skillName];
          const required = requiredSkills[skillName] || 0;
          const gapPercentage = required > 0 ? Math.max(0, ((required - available) / required) * 100) : 0;
          
          return {
            skill_name: skillName,
            required_count: required,
            available_count: available,
            gap_percentage: gapPercentage
          };
        });

        setSkillGaps(gaps);
      }

      // Cargar tareas vencidas de ambas tablas
      const [overdueTasksResult, overdueProjectTasksResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .in('status', ['pending', 'in-progress'])
          .lt('due_date', new Date().toISOString())
          .order('due_date', { ascending: true })
          .limit(5),
        supabase
          .from('tasks')
          .select('*')
          .eq('status', 'pending')
          .lt('due_date', new Date().toISOString())
          .order('due_date', { ascending: true })
          .limit(5)
      ]);

      if (!overdueTasksResult.error && !overdueProjectTasksResult.error) {
        const overdueTasks = [
          ...(overdueTasksResult.data || []).map(t => ({ ...t, table_name: 'tasks' as const })),
          ...(overdueProjectTasksResult.data || []).map(t => ({ ...t, table_name: 'tasks' as const }))
        ];
        setOverdueTasks(overdueTasks);
      }

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: 'weekly' | 'monthly') => {
    try {
      // Generar datos del reporte
      const reportData = await reportService.generateReportData(type);
      
      // Guardar en la base de datos
      if (type === 'weekly') {
        await automationService.generateWeeklyReport();
      } else {
        await automationService.generateMonthlyReport();
      }
      
      // Generar y descargar PDF
      const pdfBlob = await reportService.generatePDF(reportData, type);
      const filename = `reporte_${type}_${new Date().toISOString().split('T')[0]}.pdf`;
      reportService.downloadFile(pdfBlob, filename);
      
      // Generar y descargar CSV
      const csvBlob = await reportService.generateCSV(reportData, type);
      const csvFilename = `reporte_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      reportService.downloadFile(csvBlob, csvFilename);
      
      loadDashboardData();
    } catch (error) {
      console.error('Error generando reporte:', error);
    }
  };

  const assignTaskIntelligently = async (taskId: string, tableName: 'tasks' = 'tasks') => {
    try {
      const success = await automationService.assignTaskIntelligently(taskId, tableName);
      if (success) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error asignando tarea:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Automatización Avanzada</h2>
          <p className="text-muted-foreground">
            Sistema inteligente de gestión y optimización de tareas
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => generateReport('weekly')} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generar Reporte Semanal
          </Button>
          <Button onClick={() => generateReport('monthly')} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generar Reporte Mensual
          </Button>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_tasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tareas en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.completed_tasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.completion_rate || 0}% de eficiencia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.overdue_tasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.critical_tasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Prioridad alta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Funcionalidades */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="tasks">Gestión de Tareas</TabsTrigger>
          <TabsTrigger value="skills">Análisis de Habilidades</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Progreso de Productividad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Progreso de Productividad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tareas Completadas</span>
                      <span>{stats?.completion_rate || 0}%</span>
                    </div>
                    <Progress value={stats?.completion_rate || 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Eficiencia del Equipo</span>
                      <span>{stats?.completion_rate || 0}%</span>
                    </div>
                    <Progress value={stats?.completion_rate || 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alertas del Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Alertas del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueTasks.slice(0, 3).map((task) => (
                    <Alert key={task.id} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Tarea Vencida</AlertTitle>
                      <AlertDescription>
                        {task.title} - Asignada a {task.assignee_name || 'Sin asignar'}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {overdueTasks.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No hay alertas pendientes
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tareas que Necesitan Reasignación</CardTitle>
              <CardDescription>
                Tareas vencidas que pueden ser reasignadas automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overdueTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Vence: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                      <div className="flex space-x-2">
                        <Badge variant="destructive">Vencida</Badge>
                        <Badge variant="outline">{task.priority}</Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={() => assignTaskIntelligently(task.id, task.table_name)}
                      size="sm"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Reasignar
                    </Button>
                  </div>
                ))}
                {overdueTasks.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No hay tareas que necesiten reasignación
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Habilidades del Equipo</CardTitle>
              <CardDescription>
                Identificación de gaps de habilidades y oportunidades de mejora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillGaps.map((gap) => (
                  <div key={gap.skill_name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{gap.skill_name}</h4>
                      <Badge variant={gap.gap_percentage > 20 ? "destructive" : "secondary"}>
                        {gap.gap_percentage.toFixed(1)}% gap
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Disponibles: {gap.available_count}</span>
                        <span>Requeridas: {gap.required_count}</span>
                      </div>
                      <Progress 
                        value={(gap.available_count / gap.required_count) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reportes Generados</CardTitle>
              <CardDescription>
                Historial de reportes automáticos generados por el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        Reporte {report.type === 'weekly' ? 'Semanal' : 'Mensual'}
                      </h4>
                      <Badge variant="outline">
                        {new Date(report.generated_at).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tareas:</span>
                        <p className="font-medium">{report.data.total_tasks}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Completadas:</span>
                        <p className="font-medium text-green-600">{report.data.completed_tasks}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vencidas:</span>
                        <p className="font-medium text-red-600">{report.data.overdue_tasks}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Eficiencia:</span>
                        <p className="font-medium">{report.data.productivity_score}%</p>
                      </div>
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No hay reportes generados aún
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Automatización</CardTitle>
              <CardDescription>
                Configurar reglas y parámetros del sistema de automatización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Generación Automática de Reportes</h4>
                    <p className="text-sm text-muted-foreground">
                      Los reportes se generan automáticamente cada semana
                    </p>
                  </div>
                  <Badge variant="secondary">Activo</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Seguimiento de Deadlines</h4>
                    <p className="text-sm text-muted-foreground">
                      Verificación automática cada 6 horas
                    </p>
                  </div>
                  <Badge variant="secondary">Activo</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Asignación Inteligente</h4>
                    <p className="text-sm text-muted-foreground">
                      Reasignación automática basada en habilidades
                    </p>
                  </div>
                  <Badge variant="secondary">Activo</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Sistema de Escalación</h4>
                    <p className="text-sm text-muted-foreground">
                      Escalación automática de problemas críticos
                    </p>
                  </div>
                  <Badge variant="secondary">Activo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
