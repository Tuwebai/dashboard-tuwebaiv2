import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Target, Plus, ArrowLeft, RefreshCw, FolderKanban, Calendar, CheckCircle, Clock, AlertCircle, Search, Filter, Bell, CalendarDays, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import PhasesAndTasks from '@/components/PhasesAndTasks';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';
import { formatDateSafe } from '@/utils/formatDateSafe';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

const PhasesAndTasksPage: React.FC = () => {
  const { user, projects } = useApp();
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

  // Obtener proyectos del usuario
  const userProjects = projects.filter(p => p.created_by === user?.id);

  // =====================================================
  // REAL-TIME UPDATES
  // =====================================================

  // Configurar suscripción real-time para proyectos
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `created_by=eq.${user.id}`
        },
        (payload) => {
          console.log('Cambio detectado en proyectos:', payload);
          setLastUpdate(new Date());
          
          // Mostrar notificación de cambio
          toast({
            title: "Proyecto actualizado",
            description: `Se detectó un cambio en uno de tus proyectos`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=in.(${userProjects.map(p => p.id).join(',')})`
        },
        (payload) => {
          console.log('Cambio detectado en tareas:', payload);
          setLastUpdate(new Date());
          
          toast({
            title: "Tarea actualizada",
            description: `Se detectó un cambio en las tareas de un proyecto`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, userProjects]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (userProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(userProjects[0].id);
    }
  }, [userProjects, selectedProjectId]);

  const selectedProject = userProjects.find(p => p.id === selectedProjectId);

  // Calcular estadísticas generales
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
    let filtered = userProjects;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => getProjectStatus(project) === statusFilter);
    }

    return filtered;
  }, [userProjects, searchTerm, statusFilter]);

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
    
    userProjects.forEach(project => {
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
              type: 'phase'
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
    // Simular refresh
    setTimeout(() => setLoading(false), 1000);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Acceso no autorizado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Necesitas iniciar sesión para acceder a esta página
          </p>
          <Button onClick={() => navigate('/login')}>
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Fases y Tareas
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Seguimiento detallado del progreso de tus proyectos
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Indicador de última actualización */}
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className={`w-2 h-2 rounded-full ${lastUpdate > new Date(Date.now() - 60000) ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span>Última actualización: {lastUpdate.toLocaleTimeString()}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2"
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
        {userProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-orange-100 dark:bg-orange-500/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Target className="h-10 w-10 text-orange-600 dark:text-orange-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                No hay proyectos disponibles
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Crea tu primer proyecto para comenzar a gestionar fases y tareas de manera profesional.
              </p>
              
              <div className="space-y-4">
                <Button
                  onClick={() => navigate('/proyectos/nuevo')}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Crear Primer Proyecto
                </Button>
                
                <div>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/proyectos')}
                    className="w-full sm:w-auto"
                  >
                    Ver Todos los Proyectos
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Tabs de Navegación */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Vista General
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Calendario
                </TabsTrigger>
                <TabsTrigger value="detailed" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Detalle por Proyecto
                </TabsTrigger>
              </TabsList>

              {/* Vista General */}
              <TabsContent value="overview" className="space-y-6">
                {/* Filtros y Búsqueda */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar proyectos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
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
                </div>

                {/* Estadísticas Generales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Proyectos</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{userProjects.length}</p>
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
                            {userProjects.filter(p => getProjectStatus(p) === 'Completado').length}
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
                            {userProjects.filter(p => getProjectStatus(p) === 'En Progreso').length}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista de Proyectos */}
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
                        <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer"
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
                                </div>

                                <div className="mt-4">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span>Progreso General</span>
                                    <span>{progress}%</span>
                                  </div>
                                  <Progress value={progress} className="h-2" />
                                </div>
                              </div>

                              <div className="ml-4">
                                <Button variant="outline" size="sm">
                                  Ver Detalles
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

              {/* Vista de Calendario */}
              <TabsContent value="calendar" className="space-y-6">
                {/* Header del Calendario */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Calendario de Proyectos
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

                {/* Calendario */}
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
                        
                        return (
                          <motion.div
                            key={index}
                            className={`min-h-[120px] border-r border-b border-gray-200 dark:border-gray-700 p-2 ${
                              isCurrentMonth ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                            } ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.01 }}
                          >
                            <div className={`text-sm font-medium mb-2 ${
                              isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                            } ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
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
                                  onClick={() => {
                                    setSelectedProjectId(event.projectId);
                                    setActiveTab('detailed');
                                  }}
                                >
                                  {event.title}
                                </div>
                              ))}
                              {events.length > 3 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  +{events.length - 3} más
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de eventos próximos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Próximos Eventos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getProjectEvents()
                        .filter(event => event.date >= new Date())
                        .sort((a, b) => a.date.getTime() - b.date.getTime())
                        .slice(0, 5)
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
                                  {formatDateSafe(event.date.toISOString())}
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

              {/* Vista Detallada */}
              <TabsContent value="detailed" className="space-y-6">
                {selectedProject ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedProject.name}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          Seguimiento detallado de fases y tareas
                        </p>
                      </div>
                      
                      {userProjects.length > 1 && (
                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Seleccionar proyecto" />
                          </SelectTrigger>
                          <SelectContent>
                            {userProjects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <PhasesAndTasks 
                      project={selectedProject} 
                      user={user}
                      onUpdate={(updatedProject) => {
                        console.log('Proyecto actualizado:', updatedProject);
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
    </div>
  );
};

export default PhasesAndTasksPage;
