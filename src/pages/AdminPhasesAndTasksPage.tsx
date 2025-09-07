import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Target, 
  Plus, 
  ArrowLeft, 
  RefreshCw, 
  FolderKanban, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Bell, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  FileText,
  Zap,
  Shield,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  X
} from 'lucide-react';
import PhasesAndTasks from '@/components/PhasesAndTasks';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';
import { formatDateSafe } from '@/utils/formatDateSafe';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

const AdminPhasesAndTasksPage: React.FC = () => {
  const { theme } = useTheme();
  const { user, projects } = useApp();
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [clients, setClients] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateTasks, setDateTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskStatus, setNewTaskStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // =====================================================
  // REAL-TIME UPDATES PARA ADMIN
  // =====================================================

  useEffect(() => {
    if (!user?.id || user?.role !== 'admin') return;

    const channel = supabase
      .channel('admin-projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          console.log('Cambio detectado en proyectos (Admin):', payload);
          setLastUpdate(new Date());
          
          toast({
            title: "Proyecto actualizado",
            description: `Se detectó un cambio en un proyecto`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Cambio detectado en tareas (Admin):', payload);
          setLastUpdate(new Date());
          
          toast({
            title: "Tarea actualizada",
            description: `Se detectó un cambio en las tareas`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.role]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Cargar todos los proyectos y clientes
  useEffect(() => {
    loadAllData();
    loadAllTasks();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Cargar todos los proyectos
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          users (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      setAllProjects(projectsData || []);

      // Cargar clientes únicos
      const uniqueClients = projectsData?.reduce((acc: any[], project: any) => {
        const client = project.users;
        if (client && !acc.find(c => c.id === client.id)) {
          acc.push(client);
        }
        return acc;
      }, []) || [];

      setClients(uniqueClients);

      if (projectsData && projectsData.length > 0) {
        setSelectedProjectId(projectsData[0].id);
        setSelectedClientId(projectsData[0].created_by);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllTasks = async () => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          projects (
            id,
            name,
            users (
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      setAllTasks(tasksData || []);
    } catch (error) {
      console.error('Error cargando tareas:', error);
    }
  };

  // =====================================================
  // FUNCIONES DE CÁLCULO
  // =====================================================

  const calculateProjectProgress = (project: any) => {
    if (!project.fases || project.fases.length === 0) return 0;
    const completedPhases = project.fases.filter((f: any) => f.estado === 'Terminado').length;
    return Math.round((completedPhases / project.fases.length) * 100);
  };

  const getProjectStatus = (project: any) => {
    if (!project.fases || project.fases.length === 0) return 'Sin iniciar';
    
    const completedPhases = project.fases.filter((f: any) => f.estado === 'Terminado').length;
    const inProgressPhases = project.fases.filter((f: any) => f.estado === 'En Progreso').length;
    
    if (completedPhases === project.fases.length) return 'Completado';
    if (inProgressPhases > 0) return 'En Progreso';
    return 'Pendiente';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-300';
      case 'En Progreso': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300';
      case 'Pendiente': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300';
    }
  };

  // =====================================================
  // FILTROS Y BÚSQUEDA
  // =====================================================

  const filteredProjects = useCallback(() => {
    let filtered = allProjects;

    // Filtro por cliente
    if (clientFilter !== 'all') {
      filtered = filtered.filter(project => project.created_by === clientFilter);
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.users?.full_name && project.users.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => getProjectStatus(project) === statusFilter);
    }

    return filtered;
  }, [allProjects, searchTerm, statusFilter, clientFilter]);

  // =====================================================
  // FUNCIONES DEL CALENDARIO
  // =====================================================

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    
    return days;
  };

  const getProjectEvents = () => {
    const events: any[] = [];
    
    allProjects.forEach(project => {
      if (project.fases) {
        project.fases.forEach((phase: any) => {
          if (phase.fechaEntrega) {
            events.push({
              id: `${project.id}-${phase.key}`,
              title: `${project.name} - ${phase.descripcion || phase.key}`,
              date: new Date(phase.fechaEntrega),
              projectId: project.id,
              phaseKey: phase.key,
              status: phase.estado,
              type: 'phase',
              clientName: project.users?.full_name || 'Cliente desconocido'
            });
          }
        });
      }
    });
    
    return events;
  };

  const getEventsForDate = (date: Date) => {
    const events = getProjectEvents();
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadAllData();
  };

  // =====================================================
  // FUNCIONES DEL MODAL DE FECHA
  // =====================================================

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    setShowDateModal(true);
    await loadTasksForDate(date);
  };

  const loadTasksForDate = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      // Cargar tareas específicas del día
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          projects (
            id,
            name,
            users (
              full_name,
              email
            )
          )
        `)
        .eq('due_date', dateStr)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      setDateTasks(tasksData || []);
    } catch (error) {
      console.error('Error cargando tareas del día:', error);
      setDateTasks([]);
    }
  };

  const createTaskForDate = async () => {
    if (!selectedDate || !newTaskTitle.trim() || !newTaskProject) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTaskTitle,
          description: newTaskDescription,
          due_date: selectedDate.toISOString().split('T')[0],
          project_id: newTaskProject,
          priority: newTaskPriority,
          status: newTaskStatus,
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      // Limpiar formulario
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskProject('');
      setNewTaskPriority('medium');
      setNewTaskStatus('pending');

      // Recargar tareas del día y todas las tareas
      await loadTasksForDate(selectedDate);
      await loadAllTasks();

      toast({
        title: "Tarea creada",
        description: "La tarea se ha creado exitosamente para este día",
      });
    } catch (error) {
      console.error('Error creando tarea:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la tarea",
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Recargar tareas del día y todas las tareas
      if (selectedDate) {
        await loadTasksForDate(selectedDate);
      }
      await loadAllTasks();

      toast({
        title: "Tarea actualizada",
        description: "El estado de la tarea se ha actualizado",
      });
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // Recargar tareas del día y todas las tareas
      if (selectedDate) {
        await loadTasksForDate(selectedDate);
      }
      await loadAllTasks();

      toast({
        title: "Tarea eliminada",
        description: "La tarea se ha eliminado exitosamente",
      });
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      });
    }
  };

  // Verificar permisos de admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Solo los administradores pueden acceder a esta página
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const selectedProject = allProjects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Admin
              </Button>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-slate-600" />
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                    Gestión de Fases y Tareas
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Administración completa de proyectos de todos los clientes
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Indicador de última actualización */}
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                <div className={`w-2 h-2 rounded-full ${lastUpdate > new Date(Date.now() - 60000) ? 'bg-green-500' : 'bg-gray-400 dark:bg-slate-500'}`} />
                <span>Última actualización: {lastUpdate.toLocaleTimeString()}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando datos...</p>
          </div>
        ) : allProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-purple-100 dark:bg-purple-500/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Shield className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                No hay proyectos disponibles
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Los proyectos aparecerán aquí cuando los clientes los creen.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Tabs de Navegación */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
                  <BarChart3 className="h-4 w-4" />
                  Vista General
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
                  <Target className="h-4 w-4" />
                  Todas las Tareas
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
                  <CalendarDays className="h-4 w-4" />
                  Calendario
                </TabsTrigger>
                <TabsTrigger value="clients" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
                  <Users className="h-4 w-4" />
                  Por Cliente
                </TabsTrigger>
                <TabsTrigger value="detailed" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
                  <Target className="h-4 w-4" />
                  Detalle
                </TabsTrigger>
              </TabsList>

              {/* Vista General Admin */}
              <TabsContent value="overview" className="space-y-6">
                {/* Filtros Avanzados */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                    <Input
                      placeholder="Buscar proyectos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  
                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                      <Users className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filtrar por cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los clientes</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name || client.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="En Progreso">En Progreso</SelectItem>
                      <SelectItem value="Completado">Completado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setClientFilter('all');
                      setStatusFilter('all');
                    }}
                    className="flex items-center gap-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Limpiar Filtros
                  </Button>
                </div>

                {/* Estadísticas Generales Admin */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Proyectos</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{allProjects.length}</p>
                        </div>
                        <FolderKanban className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 dark:text-green-400 text-sm font-medium">Completados</p>
                          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {allProjects.filter(p => getProjectStatus(p) === 'Completado').length}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">En Progreso</p>
                          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                            {allProjects.filter(p => getProjectStatus(p) === 'En Progreso').length}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Clientes Activos</p>
                          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{clients.length}</p>
                        </div>
                        <Users className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista de Proyectos Admin */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Proyectos ({filteredProjects().length})
                    </h2>
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm('')}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Limpiar búsqueda
                      </Button>
                    )}
                  </div>
                  
                  {filteredProjects().map((project, index) => {
                    const progress = calculateProjectProgress(project);
                    const status = getProjectStatus(project);
                    
                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                              onClick={() => {
                                setSelectedProjectId(project.id);
                                setActiveTab('detailed');
                              }}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {project.name}
                                  </h3>
                                  <Badge className={getStatusColor(status)}>
                                    {status}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {project.users?.full_name || 'Cliente desconocido'}
                                  </Badge>
                                </div>
                                
                                {project.description && (
                                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                                    {project.description}
                                  </p>
                                )}

                                <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Creado: {formatDateSafe(project.created_at)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Target className="h-4 w-4" />
                                    <span>{project.fases?.length || 0} fases</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>{project.users?.email}</span>
                                  </div>
                                </div>

                                <div className="mt-4">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span>Progreso General</span>
                                    <span>{progress}%</span>
                                  </div>
                                  <Progress value={progress} className="h-2" />
                                </div>
                              </div>

                              <div className="ml-4 flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Vista de Todas las Tareas */}
              <TabsContent value="tasks" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Todas las Tareas ({allTasks.length})
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Gestión centralizada de todas las tareas de todos los proyectos
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAllTasks}
                    disabled={loading}
                    className="flex items-center gap-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                </div>

                {/* Estadísticas de Tareas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Tareas</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{allTasks.length}</p>
                        </div>
                        <Target className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 dark:text-green-400 text-sm font-medium">Completadas</p>
                          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {allTasks.filter(t => t.status === 'completed').length}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">En Progreso</p>
                          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                            {allTasks.filter(t => t.status === 'in_progress').length}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Pendientes</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {allTasks.filter(t => t.status === 'pending').length}
                          </p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-gray-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista de Tareas */}
                <Card>
                  <CardContent className="p-6">
                    {allTasks.length === 0 ? (
                      <div className="text-center py-12">
                        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No hay tareas disponibles
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Las tareas aparecerán aquí cuando se creen desde Websy AI o manualmente
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {allTasks.map((task, index) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-slate-800"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-medium text-gray-900 dark:text-slate-100">
                                    {task.title}
                                  </h4>
                                  <Badge 
                                    className={
                                      task.status === 'completed' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
                                        : task.status === 'in_progress'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300'
                                    }
                                  >
                                    {task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                  </Badge>
                                  <Badge 
                                    className={
                                      task.priority === 'urgent' 
                                        ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
                                        : task.priority === 'high'
                                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300'
                                        : task.priority === 'medium'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300'
                                        : 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
                                    }
                                  >
                                    {task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                                  </Badge>
                                </div>
                                
                                {task.description && (
                                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                                    {task.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
                                  <span>Proyecto: {task.projects?.name || 'Sin proyecto'}</span>
                                  <span>Cliente: {task.projects?.users?.full_name || task.projects?.users?.email || 'Sin cliente'}</span>
                                  {task.due_date && (
                                    <span>Vence: {formatDateSafe(task.due_date)}</span>
                                  )}
                                  <span>Creada: {formatDateSafe(task.created_at)}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <Select
                                  value={task.status}
                                  onValueChange={(value) => updateTaskStatus(task.id, value)}
                                >
                                  <SelectTrigger className="w-32 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pendiente</SelectItem>
                                    <SelectItem value="in_progress">En Progreso</SelectItem>
                                    <SelectItem value="completed">Completada</SelectItem>
                                    <SelectItem value="cancelled">Cancelada</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteTask(task.id)}
                                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Vista de Calendario Admin */}
              <TabsContent value="calendar" className="space-y-6">
                {/* Header del Calendario */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Calendario de Proyectos - Admin
                    </h2>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateCalendar('prev')}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToToday}
                      >
                        Hoy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateCalendar('next')}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select value={calendarView} onValueChange={(value: any) => setCalendarView(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Mes</SelectItem>
                        <SelectItem value="week">Semana</SelectItem>
                        <SelectItem value="day">Día</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Calendario Admin */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header de días de la semana */}
                    <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                        <div key={day} className="p-4 text-center font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Días del calendario */}
                    <div className="grid grid-cols-7">
                      {getCalendarDays().map((day, index) => {
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = day.toDateString() === new Date().toDateString();
                        const events = getEventsForDate(day);
                        const isHovered = hoveredDate && hoveredDate.toDateString() === day.toDateString();
                        
                        return (
                          <div
                            key={index}
                            className={`min-h-[120px] border-r border-b border-gray-200 dark:border-gray-700 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative group ${
                              isCurrentMonth ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                            } ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            onClick={() => handleDateClick(day)}
                            onMouseEnter={() => setHoveredDate(day)}
                            onMouseLeave={() => setHoveredDate(null)}
                          >
                            <div className={`text-sm font-medium mb-2 ${
                              isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                            } ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}>
                              {day.getDate()}
                            </div>
                            
                            {/* Eventos del día */}
                            <div className="space-y-1">
                              {events.slice(0, 3).map((event, eventIndex) => (
                                <div
                                  key={event.id}
                                  className={`text-xs p-1 rounded cursor-pointer truncate ${
                                    event.status === 'Terminado' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
                                      : event.status === 'En Progreso'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProjectId(event.projectId);
                                    setActiveTab('detailed');
                                  }}
                                >
                                  <div className="font-medium">{event.title}</div>
                                  <div className="text-xs opacity-75">{event.clientName}</div>
                                </div>
                              ))}
                              {events.length > 3 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  +{events.length - 3} más
                                </div>
                              )}
                            </div>
                            
                            {/* Botón de + que aparece solo en hover */}
                            {isHovered && (
                              <div
                                className="absolute top-2 right-2 animate-in fade-in-0 zoom-in-95 duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDateClick(day);
                                }}
                              >
                                <div className="w-8 h-8 bg-gray-700 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500 rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow-lg">
                                  <Plus className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de eventos próximos Admin */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Próximos Eventos - Todos los Clientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getProjectEvents()
                        .filter(event => event.date >= new Date())
                        .sort((a, b) => a.date.getTime() - b.date.getTime())
                        .slice(0, 10)
                        .map((event, index) => (
                          <motion.div
                            key={event.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div 
                              className="flex items-center gap-3 w-full"
                              onClick={() => {
                                setSelectedProjectId(event.projectId);
                                setActiveTab('detailed');
                              }}
                            >
                              <div className={`w-3 h-3 rounded-full ${
                                event.status === 'Terminado' 
                                  ? 'bg-green-500'
                                  : event.status === 'En Progreso'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-400'
                              }`} />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {event.clientName} • {formatDateSafe(event.date.toISOString())}
                                </p>
                              </div>
                              <Badge className={getStatusColor(event.status)}>
                                {event.status}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Vista por Cliente */}
              <TabsContent value="clients" className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Proyectos por Cliente</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clients.map((client, index) => {
                    const clientProjects = allProjects.filter(p => p.created_by === client.id);
                    const completedProjects = clientProjects.filter(p => getProjectStatus(p) === 'Completado').length;
                    const inProgressProjects = clientProjects.filter(p => getProjectStatus(p) === 'En Progreso').length;
                    
                    return (
                      <motion.div
                        key={client.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          <CardHeader className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                              <Users className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                              {client.full_name || client.email}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedProjects}</p>
                                  <p className="text-sm text-gray-500 dark:text-slate-400">Completados</p>
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressProjects}</p>
                                  <p className="text-sm text-gray-500 dark:text-slate-400">En Progreso</p>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">Total: {clientProjects.length} proyectos</p>
                                <Progress 
                                  value={clientProjects.length > 0 ? (completedProjects / clientProjects.length) * 100 : 0} 
                                  className="h-2"
                                />
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                                onClick={() => {
                                  setClientFilter(client.id);
                                  setActiveTab('overview');
                                }}
                              >
                                Ver Proyectos
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Vista Detallada Admin */}
              <TabsContent value="detailed" className="space-y-6">
                {selectedProject ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedProject.name}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          Cliente: {selectedProject.users?.full_name || selectedProject.users?.email}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Seleccionar proyecto" />
                          </SelectTrigger>
                          <SelectContent>
                            {allProjects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name} - {project.users?.full_name || 'Cliente desconocido'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <PhasesAndTasks 
                      project={selectedProject} 
                      user={user}
                      onUpdate={(updatedProject) => {
                        console.log('Proyecto actualizado:', updatedProject);
                        // Aquí podrías actualizar el proyecto en el estado local
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Selecciona un proyecto
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Elige un proyecto de la vista general para ver sus detalles
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Modal de Gestión por Fecha */}
      <AnimatePresence>
        {showDateModal && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                    Gestión del {selectedDate.toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Administra las fases y tareas específicas de este día
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDateModal(false)}
                className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulario para Nueva Tarea */}
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardHeader className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                      <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Nueva Tarea
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="task-title" className="text-slate-700 dark:text-slate-300">Título de la tarea</Label>
                      <Input
                        id="task-title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Ej: Revisar diseño del proyecto X"
                        className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <Label htmlFor="task-description" className="text-slate-700 dark:text-slate-300">Descripción</Label>
                      <Textarea
                        id="task-description"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        placeholder="Detalles adicionales de la tarea..."
                        rows={3}
                        className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <Label htmlFor="task-project" className="text-slate-700 dark:text-slate-300">Proyecto</Label>
                      <Select value={newTaskProject} onValueChange={setNewTaskProject}>
                        <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                          <SelectValue placeholder="Seleccionar proyecto" />
                        </SelectTrigger>
                        <SelectContent>
                          {allProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name} - {project.users?.full_name || 'Cliente desconocido'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="task-priority" className="text-slate-700 dark:text-slate-300">Prioridad</Label>
                        <Select value={newTaskPriority} onValueChange={(value: any) => setNewTaskPriority(value)}>
                          <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="task-status" className="text-slate-700 dark:text-slate-300">Estado</Label>
                        <Select value={newTaskStatus} onValueChange={(value: any) => setNewTaskStatus(value)}>
                          <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="in_progress">En Progreso</SelectItem>
                            <SelectItem value="completed">Completado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      onClick={createTaskForDate}
                      disabled={!newTaskTitle.trim() || !newTaskProject}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Tarea
                    </Button>
                  </CardContent>
                </Card>

                {/* Lista de Tareas del Día */}
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardHeader className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                      <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Tareas del Día ({dateTasks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dateTasks.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-slate-400">
                          No hay tareas programadas para este día
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dateTasks.map((task, index) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:shadow-md transition-shadow bg-gray-50 dark:bg-slate-700/50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-slate-100 mb-1">
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
                                  <span>Proyecto: {task.projects?.name}</span>
                                  <span>Cliente: {task.projects?.users?.full_name || task.projects?.users?.email}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <Select
                                  value={task.status}
                                  onValueChange={(value) => updateTaskStatus(task.id, value)}
                                >
                                  <SelectTrigger className="w-32 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pendiente</SelectItem>
                                    <SelectItem value="in_progress">En Progreso</SelectItem>
                                    <SelectItem value="completed">Completado</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteTask(task.id)}
                                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-3">
                              <Badge 
                                className={
                                  task.priority === 'high' 
                                    ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
                                    : task.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300'
                                    : 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
                                }
                              >
                                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                              </Badge>
                              
                              <Badge 
                                className={
                                  task.status === 'completed' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
                                    : task.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300'
                                }
                              >
                                {task.status === 'completed' ? 'Completado' : task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPhasesAndTasksPage;
