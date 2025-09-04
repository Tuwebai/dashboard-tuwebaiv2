import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar as CalendarIcon,
  Flag,
  Edit,
  Trash2,
  MoreVertical,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  BarChart3,
  Target,
  Users,
  CheckSquare,
  Square
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '../lib/supabase';

import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { formatDateSafe } from '@/utils/formatDateSafe';

interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  phaseKey?: string;
  assignedTo: string[];
  assignedBy: string;
  assignedByName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: any;
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
  completedBy?: string;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  comments: Array<{
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    timestamp: any;
  }>;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

interface SharedTasksProps {
  projectId: string;
  phaseKey?: string;
  onTaskCompleted?: (task: Task) => void;
}

export default function SharedTasks({ 
  projectId, 
  phaseKey,
  onTaskCompleted 
}: SharedTasksProps) {
  const { user } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New task form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: [] as string[],
    priority: 'medium' as Task['priority'],
    dueDate: undefined as Date | undefined,
    tags: [] as string[],
    estimatedHours: 0
  });

  // Load tasks function
  const loadTasks = async () => {
    if (!projectId) return;
    setIsLoading(true);

    try {
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('projectId', projectId)
        .eq('phaseKey', phaseKey || '')
        .order('createdAt', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTasks(tasksData || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las tareas.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load tasks
  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);

    const subscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `projectId=eq.${projectId}` },
        (payload) => {
          // Recargar tareas cuando hay cambios
          loadTasks();
        }
      )
      .subscribe();
    
    // Cargar datos iniciales
    loadTasks();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [projectId, phaseKey]);

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterAssignee !== 'all' && !task.assignedTo.includes(filterAssignee)) return false;
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'dueDate':
          aValue = a.dueDate?.toDate?.() || new Date(0);
          bValue = b.dueDate?.toDate?.() || new Date(0);
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder = { pending: 1, in_progress: 2, completed: 3, cancelled: 4 };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case 'createdAt':
          aValue = a.createdAt?.toDate?.() || new Date(0);
          bValue = b.createdAt?.toDate?.() || new Date(0);
          break;
        default:
          aValue = a.dueDate?.toDate?.() || new Date(0);
          bValue = b.dueDate?.toDate?.() || new Date(0);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Add new task
  const addTask = async () => {
    if (!newTask.title.trim() || !user) return;

    try {
      const taskData = {
        ...newTask,
        projectId,
        phaseKey: phaseKey || '',
        assignedBy: user.uid,
        assignedByName: user.name,
        status: 'pending' as Task['status'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: []
      };

      const { error: taskError } = await supabase
        .from('tasks')
        .insert(taskData);
      
      if (taskError) throw taskError;

      setNewTask({
        title: '',
        description: '',
        assignedTo: [],
        priority: 'medium',
        dueDate: undefined,
        tags: [],
        estimatedHours: 0
      });
      setShowNewTaskDialog(false);

      toast({
        title: 'Tarea creada',
        description: 'La tarea ha sido creada exitosamente.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la tarea.',
        variant: 'destructive'
      });
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completedAt = new Date().toISOString();
        updateData.completedBy = user?.uid;
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);
      
      if (updateError) throw updateError;

      if (status === 'completed' && onTaskCompleted) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          onTaskCompleted({ ...task, status, completedAt: updateData.completedAt });
        }
      }

      toast({
        title: 'Tarea actualizada',
        description: `La tarea ha sido marcada como ${status === 'completed' ? 'completada' : status}.`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la tarea.',
        variant: 'destructive'
      });
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para borrar tareas.',
        variant: 'destructive'
      });
      return;
    }
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (user.role !== 'admin' && task.assignedBy !== user.uid) {
      toast({
        title: 'Sin permisos',
        description: 'Solo el creador o un admin puede borrar esta tarea.',
        variant: 'destructive'
      });
      return;
    }
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (deleteError) throw deleteError;
      toast({
        title: 'Tarea eliminada',
        description: 'La tarea ha sido eliminada.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la tarea.',
        variant: 'destructive'
      });
    }
  };

  // Get priority color
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  // Get status color
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'cancelled': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  // Get status icon
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'pending': return <Square className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <Square className="h-4 w-4" />;
    }
  };

  // Format date
  const formatDate = (date: any) => {
    if (!date) return '';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, 'dd/MM/yyyy', { locale: es });
  };

  // Check if task is overdue
  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'completed') return false;
    const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    return dueDate < new Date();
  };

  // Calculate progress
  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  // Get unique assignees
  const getUniqueAssignees = () => {
    const assignees = new Set<string>();
    tasks.forEach(task => {
      task.assignedTo.forEach(assignee => assignees.add(assignee));
    });
    return Array.from(assignees);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-8 w-8 bg-muted/30 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 bg-muted/20 rounded" />
                  <div className="h-3 w-1/3 bg-muted/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tareas Compartidas</h2>
          <p className="text-muted-foreground">
            Gestiona las tareas del proyecto {phaseKey && `- ${phaseKey}`}
          </p>
        </div>
        <Button onClick={() => setShowNewTaskDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Progreso General</h3>
            <span className="text-sm text-muted-foreground">
              {tasks.filter(t => t.status === 'completed').length} de {tasks.length} completadas
            </span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
          <div className="grid grid-cols-4 gap-4 mt-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-500">
                {tasks.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-xs text-muted-foreground">Pendientes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">
                {tasks.filter(t => t.status === 'in_progress').length}
              </div>
              <div className="text-xs text-muted-foreground">En Progreso</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground">Completadas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">
                {tasks.filter(t => isOverdue(t)).length}
              </div>
              <div className="text-xs text-muted-foreground">Vencidas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Input
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Asignado a" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {getUniqueAssignees().map(assignee => (
                    <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Fecha límite</SelectItem>
                  <SelectItem value="priority">Prioridad</SelectItem>
                  <SelectItem value="status">Estado</SelectItem>
                  <SelectItem value="createdAt">Fecha de creación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No hay tareas</p>
              <p className="text-sm text-muted-foreground">
                {tasks.length === 0 
                  ? 'Crea la primera tarea para comenzar'
                  : 'No se encontraron tareas con los filtros aplicados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                        className="h-6 w-6 p-0"
                        disabled={user?.role !== 'admin' && task.assignedBy !== user?.uid}
                      >
                        {task.status === 'completed' ? (
                          <CheckSquare className="h-4 w-4 text-green-500" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h3>
                      
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        <Flag className="h-3 w-3 mr-1" />
                        {task.priority}
                      </Badge>
                      
                      <Badge variant="outline" className={getStatusColor(task.status)}>
                        {getStatusIcon(task.status)}
                        <span className="ml-1">
                          {task.status === 'completed' ? 'Completada' :
                           task.status === 'in_progress' ? 'En Progreso' :
                           task.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                        </span>
                      </Badge>
                      
                      {isOverdue(task) && (
                        <Badge variant="destructive" className="text-xs">
                          Vencida
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {task.assignedTo.length} asignado(s)
                      </span>
                      
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue(task) ? 'text-red-500' : ''}`}>
                          <CalendarIcon className="h-3 w-3" />
                          {formatDateSafe(task.dueDate)}
                        </span>
                      )}
                      
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.assignedByName}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTaskDetails(task)}
                            disabled={user?.role !== 'admin' && task.assignedBy !== user?.uid}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar tarea</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {(user?.role === 'admin' || task.assignedBy === user?.uid) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTask(task.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Eliminar tarea</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Task Dialog */}
      <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogDescription>
              Crea una nueva tarea para el proyecto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Título de la tarea"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Descripción detallada de la tarea"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Prioridad</label>
                <Select value={newTask.priority} onValueChange={(value: Task['priority']) => setNewTask({ ...newTask, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Fecha límite</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTask.dueDate ? formatDateSafe(newTask.dueDate) : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newTask.dueDate}
                      onSelect={(date) => setNewTask({ ...newTask, dueDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={addTask} disabled={!newTask.title.trim()}>
                Crear Tarea
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      {showTaskDetails && (
        <Dialog open={!!showTaskDetails} onOpenChange={() => setShowTaskDetails(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{showTaskDetails.title}</DialogTitle>
              <DialogDescription>
                Detalles completos de la tarea
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Descripción</h4>
                <p className="text-sm text-muted-foreground">
                  {showTaskDetails.description}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Estado</h4>
                  <Badge variant="outline" className={getStatusColor(showTaskDetails.status)}>
                    {getStatusIcon(showTaskDetails.status)}
                    <span className="ml-1">
                      {showTaskDetails.status === 'completed' ? 'Completada' :
                       showTaskDetails.status === 'in_progress' ? 'En Progreso' :
                       showTaskDetails.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                    </span>
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Prioridad</h4>
                  <Badge variant="outline" className={getPriorityColor(showTaskDetails.priority)}>
                    <Flag className="h-3 w-3 mr-1" />
                    {showTaskDetails.priority}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Asignado por</h4>
                  <p className="text-sm text-muted-foreground">
                    {showTaskDetails.assignedByName}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Fecha de creación</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDateSafe(showTaskDetails.createdAt)}
                  </p>
                </div>
              </div>
              
              {showTaskDetails.dueDate && (
                <div>
                  <h4 className="font-semibold mb-2">Fecha límite</h4>
                  <p className={`text-sm ${isOverdue(showTaskDetails) ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {formatDateSafe(showTaskDetails.dueDate)}
                    {isOverdue(showTaskDetails) && ' (Vencida)'}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => updateTaskStatus(showTaskDetails.id, 'completed')}
                  disabled={showTaskDetails.status === 'completed'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como completada
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 
