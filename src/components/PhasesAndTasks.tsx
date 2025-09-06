import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Play, 
  Pause, 
  User, 
  MessageSquare, 
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  Send,
  FileText,
  Target,
  Zap,
  Palette,
  Code,
  Search,
  Globe,
  Database
} from 'lucide-react';
import { SupabaseService, Task } from '@/lib/supabaseService';
import { formatDateSafe } from '@/utils/formatDateSafe';
import { toast } from '@/hooks/use-toast';

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

interface ProjectPhase {
  key: string;
  estado: 'Pendiente' | 'En Progreso' | 'En Revisión' | 'Aprobada' | 'Terminado' | 'Bloqueada';
  descripcion?: string;
  fechaEntrega?: string;
  archivos?: Array<{ url: string; name: string }>;
  comentarios?: Array<{
    id: string;
    texto: string;
    autor: string;
    fecha: string;
    tipo: 'admin' | 'cliente';
  }>;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  fases?: ProjectPhase[];
  created_at: string;
  updated_at: string;
}

interface PhasesAndTasksProps {
  project: Project;
  user: any;
  onUpdate?: (project: Project) => void;
}

interface TaskComment {
  id: string;
  task_id: string;
  text: string;
  author: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// CONFIGURACIÓN DE FASES
// =====================================================

const PHASE_CONFIG = {
  ui: { 
    label: 'UI Design', 
    icon: Palette, 
    color: 'from-purple-500 to-pink-500',
    description: 'Diseño de interfaz y experiencia de usuario'
  },
  maquetado: { 
    label: 'Maquetado', 
    icon: Code, 
    color: 'from-blue-500 to-cyan-500',
    description: 'Estructuración y maquetado de páginas'
  },
  contenido: { 
    label: 'Contenido', 
    icon: FileText, 
    color: 'from-green-500 to-emerald-500',
    description: 'Creación y optimización de contenido'
  },
  funcionalidades: { 
    label: 'Funcionalidades', 
    icon: Zap, 
    color: 'from-orange-500 to-red-500',
    description: 'Desarrollo de características interactivas'
  },
  seo: { 
    label: 'SEO', 
    icon: Search, 
    color: 'from-indigo-500 to-purple-500',
    description: 'Optimización para motores de búsqueda'
  },
  deploy: { 
    label: 'Deploy', 
    icon: Globe, 
    color: 'from-teal-500 to-blue-500',
    description: 'Despliegue y puesta en producción'
  }
};

const STATUS_CONFIG = {
  'Pendiente': { 
    color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300', 
    icon: Clock 
  },
  'En Progreso': { 
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300', 
    icon: Play 
  },
  'En Revisión': { 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300', 
    icon: AlertCircle 
  },
  'Aprobada': { 
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-300', 
    icon: CheckCircle 
  },
  'Terminado': { 
    color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300', 
    icon: Target 
  },
  'Bloqueada': { 
    color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300', 
    icon: Pause 
  }
};

const TASK_STATUS_CONFIG = {
  'pending': { 
    color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300', 
    icon: Clock,
    label: 'Pendiente'
  },
  'in_progress': { 
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300', 
    icon: Play,
    label: 'En Progreso'
  },
  'completed': { 
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-300', 
    icon: CheckCircle,
    label: 'Completada'
  },
  'cancelled': { 
    color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300', 
    icon: AlertCircle,
    label: 'Cancelada'
  }
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const PhasesAndTasks: React.FC<PhasesAndTasksProps> = ({ project, user, onUpdate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [taskComments, setTaskComments] = useState<Record<string, TaskComment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // =====================================================
  // EFECTOS Y DATOS
  // =====================================================

  useEffect(() => {
    loadTasks();
  }, [project.id]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const projectTasks = await SupabaseService.getTasks(project.id);
      setTasks(projectTasks);
    } catch (error) {
      console.error('Error cargando tareas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas del proyecto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular progreso de cada fase
  const calculatePhaseProgress = useCallback((phaseKey: string) => {
    const phaseTasks = tasks.filter(task => task.phase_key === phaseKey);
    if (phaseTasks.length === 0) return 0;
    
    const completedTasks = phaseTasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / phaseTasks.length) * 100);
  }, [tasks]);

  // Obtener tareas de una fase
  const getPhaseTasks = useCallback((phaseKey: string) => {
    return tasks.filter(task => 
      task.phase_key === phaseKey && 
      (searchTerm === '' || 
       task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       task.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [tasks, searchTerm]);

  // Obtener fases ordenadas
  const sortedPhases = useMemo(() => {
    if (!project.fases) return [];
    
    const phaseOrder = ['ui', 'maquetado', 'contenido', 'funcionalidades', 'seo', 'deploy'];
    return project.fases.sort((a, b) => {
      const aIndex = phaseOrder.indexOf(a.key);
      const bIndex = phaseOrder.indexOf(b.key);
      return aIndex - bIndex;
    });
  }, [project.fases]);

  // =====================================================
  // MANEJADORES DE EVENTOS
  // =====================================================

  const togglePhaseExpansion = (phaseKey: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseKey)) {
      newExpanded.delete(phaseKey);
    } else {
      newExpanded.add(phaseKey);
    }
    setExpandedPhases(newExpanded);
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await SupabaseService.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      
      toast({
        title: "Tarea actualizada",
        description: `Estado cambiado a ${TASK_STATUS_CONFIG[newStatus].label}`,
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

  const handleAddComment = async (taskId: string) => {
    const commentText = newComment[taskId]?.trim();
    if (!commentText) return;

    try {
      // Aquí implementarías la lógica para agregar comentarios
      // Por ahora simulamos la adición
      const newCommentObj: TaskComment = {
        id: Date.now().toString(),
        task_id: taskId,
        text: commentText,
        author: user.id,
        author_name: user.full_name || user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setTaskComments(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), newCommentObj]
      }));

      setNewComment(prev => ({ ...prev, [taskId]: '' }));
      
      toast({
        title: "Comentario agregado",
        description: "Tu comentario ha sido enviado",
      });
    } catch (error) {
      console.error('Error agregando comentario:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive",
      });
    }
  };

  // =====================================================
  // RENDERIZADO
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fases y Tareas
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Seguimiento detallado del progreso del proyecto
          </p>
        </div>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Roadmap de Fases */}
      <div className="grid gap-4">
        {sortedPhases.map((phase, index) => {
          const config = PHASE_CONFIG[phase.key as keyof typeof PHASE_CONFIG];
          const IconComponent = config?.icon || Target;
          const phaseTasks = getPhaseTasks(phase.key);
          const progress = calculatePhaseProgress(phase.key);
          const isExpanded = expandedPhases.has(phase.key);
          const statusConfig = STATUS_CONFIG[phase.estado];

          return (
            <motion.div
              key={phase.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => togglePhaseExpansion(phase.key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${config?.color || 'from-gray-500 to-gray-600'} shadow-lg`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                          {config?.label || phase.key}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {phase.descripcion || config?.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge className={statusConfig.color}>
                        <statusConfig.icon className="h-3 w-3 mr-1" />
                        {phase.estado}
                      </Badge>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {progress}%
                        </div>
                        <Progress value={progress} className="w-20 h-2" />
                      </div>

                      <Button variant="ghost" size="sm">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        
                        {/* Lista de Tareas */}
                        <div className="space-y-3">
                          {phaseTasks.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No hay tareas en esta fase</p>
                            </div>
                          ) : (
                            phaseTasks.map((task) => {
                              const taskStatusConfig = TASK_STATUS_CONFIG[task.status];
                              const taskComments = taskComments[task.id] || [];

                              return (
                                <motion.div
                                  key={task.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800/50"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                          {task.title}
                                        </h4>
                                        <Badge className={taskStatusConfig.color}>
                                          <taskStatusConfig.icon className="h-3 w-3 mr-1" />
                                          {taskStatusConfig.label}
                                        </Badge>
                                      </div>
                                      
                                      {task.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                          {task.description}
                                        </p>
                                      )}

                                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          <span>{task.assigned_to || 'Sin asignar'}</span>
                                        </div>
                                        
                                        {task.due_date && (
                                          <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>{formatDateSafe(task.due_date)}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Comentarios */}
                                      {taskComments.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                          {taskComments.map((comment) => (
                                            <div key={comment.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                              <div className="flex items-center gap-2 mb-1">
                                                <Avatar className="h-6 w-6">
                                                  <AvatarFallback className="text-xs">
                                                    {comment.author_name.charAt(0).toUpperCase()}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                  {comment.author_name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                  {formatDateSafe(comment.created_at)}
                                                </span>
                                              </div>
                                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {comment.text}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Agregar comentario */}
                                      <div className="mt-3 flex gap-2">
                                        <Textarea
                                          placeholder="Agregar comentario..."
                                          value={newComment[task.id] || ''}
                                          onChange={(e) => setNewComment(prev => ({
                                            ...prev,
                                            [task.id]: e.target.value
                                          }))}
                                          className="flex-1 min-h-[60px]"
                                        />
                                        <Button
                                          size="sm"
                                          onClick={() => handleAddComment(task.id)}
                                          disabled={!newComment[task.id]?.trim()}
                                        >
                                          <Send className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="flex flex-col gap-2">
                                      {task.status !== 'completed' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleTaskStatusChange(task.id, 'completed')}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Completar
                                        </Button>
                                      )}
                                      
                                      {task.status === 'pending' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleTaskStatusChange(task.id, 'in_progress')}
                                        >
                                          <Play className="h-4 w-4 mr-1" />
                                          Iniciar
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })
                          )}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Resumen del Proyecto */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Progreso General del Proyecto
              </h3>
              <p className="text-blue-700 dark:text-blue-300">
                {tasks.filter(t => t.status === 'completed').length} de {tasks.length} tareas completadas
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
              </div>
              <Progress 
                value={tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0} 
                className="w-32 h-3 mt-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhasesAndTasks;
