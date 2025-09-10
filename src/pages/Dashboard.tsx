import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Eye,
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Send,
  Search,
  RefreshCw,
  Bell,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Star,
  Zap,
  Target,
  Award,
  Activity,
  User,
  Play,
  Pause,
  Keyboard,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { formatDateSafe } from '@/utils/formatDateSafe';
import VerDetallesProyecto from '@/components/VerDetallesProyecto';
import ProjectCollaborationModal from '@/components/ProjectCollaborationModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { userService } from '@/lib/supabaseService';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRealtimeProjects } from '@/hooks/useRealtimeProjects';
import ContextualHelp from '@/components/tutorial/ContextualHelp';
import { useLazyLoading } from '@/hooks/useLazyLoading';
import { useIntelligentCache } from '@/hooks/useIntelligentCache';
import VirtualScrollList from '@/components/VirtualScrollList';
import OptimizedImage from '@/components/OptimizedImage';

// Estilos CSS personalizados para animaciones
const customStyles = `
  @keyframes gradient-x {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
    50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 3s ease infinite;
  }
  
  .animate-spin-slow {
    animation: spin 3s linear infinite;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  
  .card-hover-effect {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card-hover-effect:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  
  .metric-value-animation {
    transition: all 0.3s ease;
  }
  
  .metric-value-animation:hover {
    transform: scale(1.1);
    text-shadow: 0 0 20px currentColor;
  }
`;

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
  description: string | null;
  created_by: string;
  status: string;
  created_at: string;
  updated_at: string;
  progress: number;
  // Campos extendidos para compatibilidad
  type?: string;
  ownerEmail?: string;
  createdAt?: string;
  fases?: ProjectPhase[];
}

const FASES = [
  { key: 'ui', label: 'UI Design', icon: '🎨' },
  { key: 'maquetado', label: 'Maquetado', icon: '📱' },
  { key: 'contenido', label: 'Contenido', icon: '📝' },
  { key: 'funcionalidades', label: 'Funcionalidades', icon: '⚙️' },
  { key: 'seo', label: 'SEO', icon: '🔍' },
  { key: 'deploy', label: 'Deploy', icon: '🚀' },
];

const Dashboard = React.memo(() => {
  const { user, projects, updateProject, addCommentToPhase, deleteProject, loading } = useApp();
  const navigate = useNavigate();
  
  // Función para navegar a proyectos con filtros específicos
  const navigateToProjects = (filter: string, value?: string) => {
    const params = new URLSearchParams();
    if (filter && value) {
      params.set(filter, value);
    }
    navigate(`/proyectos?${params.toString()}`);
  };
  
  // Configurar actualizaciones en tiempo real
  const { refreshProjects } = useRealtimeProjects();
  const [comentarioInput, setComentarioInput] = useState<Record<string, string>>({});
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialized, setModalInitialized] = useState(false);
  const [realTimeProjects, setRealTimeProjects] = useState<Project[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [projectCreators, setProjectCreators] = useState<Record<string, { full_name: string; email: string }>>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('overview');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  // Cache inteligente para datos del dashboard
  const cache = useIntelligentCache({
    ttl: 5 * 60 * 1000, // 5 minutos
    maxSize: 50,
    enableLRU: true
  });

  // Función para calcular progreso del proyecto
  const calculateProjectProgress = useCallback((project: Project) => {
    if (!project.fases || project.fases.length === 0) return 0;
    const completedPhases = project.fases.filter((f: ProjectPhase) => f.estado === 'Terminado').length;
    return Math.round((completedPhases / project.fases.length) * 100);
  }, []);

  // Función para obtener el estado del proyecto
  const getProjectStatus = useCallback((project: Project) => {
    if (!project.fases || project.fases.length === 0) return 'Sin iniciar';
    
    const completedPhases = project.fases.filter((f: ProjectPhase) => f.estado === 'Terminado').length;
    const totalPhases = project.fases.length;
    
    if (completedPhases === 0) return 'Sin iniciar';
    if (completedPhases === totalPhases) return 'Completado';
    if (completedPhases > totalPhases / 2) return 'En progreso avanzado';
    return 'En progreso';
  }, []);

  // Función para obtener el color del estado
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Completado': 
        return 'bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/40 dark:shadow-green-500/10';
      case 'En progreso avanzado': 
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/40 dark:shadow-blue-500/10';
      case 'En progreso': 
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/40 dark:shadow-yellow-500/10';
      case 'Sin iniciar': 
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/40 dark:shadow-slate-500/10';
      default: 
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/40 dark:shadow-slate-500/10';
    }
  }, []);

  // Función para obtener el icono del estado
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'Completado': return <CheckCircle className="h-4 w-4" />;
      case 'En progreso avanzado': return <Play className="h-4 w-4" />;
      case 'En progreso': return <Pause className="h-4 w-4" />;
      case 'Sin iniciar': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  }, []);

  // Función para cargar información de los creadores de proyectos
  const loadProjectCreators = useCallback(async (projects: Project[]) => {
    try {
      const creators: Record<string, { full_name: string; email: string }> = {};
      
      for (const project of projects) {
        // Validar que el proyecto tenga created_by válido
        if (!project.created_by || project.created_by.trim() === '') {
          continue;
        }

        // Evitar cargar el mismo creador múltiples veces
        if (creators[project.created_by]) {
          continue;
        }

        // Validar que el ID del creador sea válido antes de hacer la llamada
        if (project.created_by && typeof project.created_by === 'string' && project.created_by.length > 0) {
          try {
            const creator = await userService.getUserById(project.created_by);
            
            if (creator && creator.id) {
              creators[project.created_by] = {
                full_name: creator.full_name || 'Usuario sin nombre',
                email: creator.email || 'sin-email@example.com'
              };
            } else {
              creators[project.created_by] = {
                full_name: 'Usuario no encontrado',
                email: 'no-encontrado@example.com'
              };
            }
          } catch (error) {
            creators[project.created_by] = {
              full_name: 'Error al cargar',
              email: 'error@example.com'
            };
          }
        } else {
          // ID inválido o vacío
          creators[project.created_by] = {
            full_name: 'ID inválido',
            email: 'id-invalido@example.com'
          };
        }
      }
      
      setProjectCreators(creators);
    } catch (error) {
      console.error('Error cargando creadores de proyectos:', error);
    }
  }, []);

  // Proyectos visibles para el usuario actual y validación temprana
  const userProjects = realTimeProjects.filter(p => p.created_by === user?.id && p.id);
  const hasValidProjects = userProjects.length > 0;

  // Filtros y ordenamiento de proyectos
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = userProjects;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => getProjectStatus(project) === statusFilter);
    }


    // Ordenamiento normal
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'progress':
          comparison = calculateProjectProgress(a) - calculateProjectProgress(b);
          break;
        case 'recent':
          comparison = new Date(a.created_at || a.createdAt || '').getTime() - new Date(b.created_at || b.createdAt || '').getTime();
          break;
        case 'status':
          const statusA = getProjectStatus(a);
          const statusB = getProjectStatus(b);
          comparison = statusA.localeCompare(statusB);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [userProjects, searchTerm, statusFilter, sortBy, sortOrder]);

  // Estadísticas calculadas
  const dashboardStats = useMemo(() => {
    const totalProjects = userProjects.length;
    const inProgressProjects = userProjects.filter(p => getProjectStatus(p) === 'En progreso' || getProjectStatus(p) === 'En progreso avanzado').length;
    const completedProjects = userProjects.filter(p => getProjectStatus(p) === 'Completado').length;
    const pendingProjects = userProjects.filter(p => getProjectStatus(p) === 'Sin iniciar').length;
    
    const totalComments = userProjects.reduce((acc, p) => 
      acc + (p.fases?.reduce((sum: number, f: ProjectPhase) => 
        sum + (f.comentarios?.length || 0), 0) || 0), 0
    );

    const averageProgress = totalProjects > 0 
      ? Math.round(userProjects.reduce((acc, p) => acc + calculateProjectProgress(p), 0) / totalProjects)
      : 0;

    const recentActivity = userProjects
      .filter(p => p.fases?.some(f => f.comentarios?.length > 0))
      .slice(0, 5);

    return {
      totalProjects,
      inProgressProjects,
      completedProjects,
      pendingProjects,
      totalComments,
      averageProgress,
      recentActivity
    };
  }, [userProjects]);

  // Escuchar cambios en tiempo real de los proyectos del usuario
  useEffect(() => {
    if (!user) {
      setRealTimeProjects([]);
      return;
    }

    const userProjects = projects.filter(p => p.created_by === user.id);
    
    if (userProjects.length === 0) {
      setRealTimeProjects([]);
      return;
    }

    // Usar los proyectos directamente desde el contexto de Supabase
    setRealTimeProjects(userProjects);
    
    // Cargar información de los creadores de proyectos
    loadProjectCreators(userProjects);
  }, [user, projects, loadProjectCreators]);

  // Limpiar estado del modal cuando se desmonte el componente
  useEffect(() => {
    return () => {
      setIsModalOpen(false);
      setSelectedProject(null);
      setModalInitialized(false);
    };
  }, []);

  // Verificar que el modal no se abra automáticamente
  useEffect(() => {
    if (isModalOpen && !modalInitialized) {
      // Modal se abrió automáticamente, cerrando...
      setIsModalOpen(false);
      setSelectedProject(null);
    }
  }, [isModalOpen, modalInitialized]);

  // Verificar que el modal no se abra cuando no hay proyectos válidos
  useEffect(() => {
    if (isModalOpen && !hasValidProjects) {
      // Modal abierto sin proyectos válidos, cerrando...
      setIsModalOpen(false);
      setSelectedProject(null);
      setModalInitialized(false);
    }
  }, [isModalOpen, hasValidProjects]);



  const handleComentarioChange = (projectId: string, faseKey: string, value: string) => {
    setComentarioInput(prev => ({ ...prev, [`${projectId}-${faseKey}`]: value }));
  };

  const handleComentarioSubmit = async (projectId: string, faseKey: string) => {
    if (!comentarioInput[`${projectId}-${faseKey}`]?.trim()) return;

    try {
      await addCommentToPhase(projectId, faseKey, {
        texto: comentarioInput[`${projectId}-${faseKey}`],
        autor: user?.full_name || user?.email || 'Cliente',
        tipo: 'cliente'
      });
      
      setComentarioInput(prev => ({ ...prev, [`${projectId}-${faseKey}`]: '' }));
      toast({ title: 'Comentario enviado', description: 'Tu comentario fue guardado y el admin será notificado.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo enviar el comentario.', variant: 'destructive' });
    }
  };

  // Función para crear nuevo proyecto
  const handleCreateProject = () => {
    navigate('/proyectos/nuevo');
  };


  // Función para eliminar proyecto
  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      toast({
        title: '✅ Proyecto eliminado',
        description: 'El proyecto ha sido eliminado exitosamente',
        duration: 3000
      });
    } catch (error) {
      toast({
        title: '❌ Error al eliminar',
        description: 'No se pudo eliminar el proyecto. Inténtalo de nuevo.',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  // Función para cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
    setModalInitialized(false);
  };

  // Función para descargar archivos
  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };

  // Función para actualizar datos en tiempo real
  const refreshData = async () => {
    setLastUpdate(new Date());
    toast({ title: 'Actualizado', description: 'Datos actualizados correctamente.' });
  };

  // Función para manejar búsqueda desde el TopBar
  const handleSearchFromTopBar = (term: string) => {
    setSearchTerm(term);
  };

  // Función para limpiar filtros
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('recent');
    setSortOrder('desc');
  }, []);

  // Función para exportar datos del dashboard
  const exportDashboardData = useCallback(() => {
    const data = {
      fecha: new Date().toISOString(),
      usuario: user?.full_name || user?.email,
      estadisticas: dashboardStats,
      proyectos: filteredAndSortedProjects.map(p => ({
        nombre: p.name,
        estado: getProjectStatus(p),
        progreso: calculateProjectProgress(p),
        fechaCreacion: p.created_at || p.createdAt
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${user?.email}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Exportado', description: 'Datos del dashboard exportados correctamente.' });
  }, [dashboardStats, filteredAndSortedProjects, user]);




  // Funciones para keyboard shortcuts
  const handleSearchFocus = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Configurar keyboard shortcuts
  const keyboardShortcuts = useKeyboardShortcuts({
    onClearFilters: clearFilters,
    onExportData: exportDashboardData,
    onCreateProject: handleCreateProject,
    onRefreshData: refreshData,
    onSearchFocus: handleSearchFocus,
    hasProjects: hasValidProjects
  });

  const { showShortcutsHelp } = keyboardShortcuts;

  // Si es admin, redirigir al panel de admin
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
          <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background/95 to-background/90 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
        <div className="flex-1 overflow-hidden w-full">
          <div className="h-full overflow-y-auto w-full">
          


          {/* ZONA 2: MÉTRICAS CLAVE (1 fila horizontal) */}
          <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 sm:p-6 shadow-lg"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Proyectos */}
                <div className="flex flex-col items-center p-4 border-r border-slate-200 dark:border-slate-600 last:border-r-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Proyectos</h3>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">
                    Activos: {dashboardStats.totalProjects}
                  </p>
                  <button 
                    onClick={() => navigate('/proyectos')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    [Ver todos]
                  </button>
                </div>

                {/* Progreso */}
                <div className="flex flex-col items-center p-4 border-r border-slate-200 dark:border-slate-600 last:border-r-0">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Progreso</h3>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">
                    General: {dashboardStats.averageProgress}%
                  </p>
                  <button 
                    onClick={() => navigateToProjects('view', 'progress')}
                    className="text-xs text-green-600 dark:text-green-400 hover:underline"
                  >
                    [Ver detalle]
                  </button>
                </div>

                {/* Tareas */}
                <div className="flex flex-col items-center p-4 border-r border-slate-200 dark:border-slate-600 last:border-r-0">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mb-3">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Tareas</h3>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-2">
                    Pendientes: {userProjects.reduce((acc, p) => acc + (p.fases?.filter(f => f.estado === 'Pendiente' || f.estado === 'En Progreso').length || 0), 0)}
                  </p>
                  <button 
                    onClick={() => navigate('/fases-tareas')}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    [Crear]
                  </button>
                </div>

                {/* Equipo */}
                <div className="flex flex-col items-center p-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Equipo</h3>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1">
                    Activo: <CheckCircle className="h-4 w-4 text-green-500" />
                  </p>
                  <button 
                    onClick={() => setShowCollaborationModal(true)}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    [Chat]
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ZONA 3: ACCIONES Y CONTENIDO (2 columnas) */}
          <div className="px-3 sm:px-4 lg:px-8 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Columna Izquierda */}
              <div className="space-y-4 sm:space-y-6">
                {/* ACCIONES PRINCIPALES */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-500" />
                        ACCIONES PRINCIPALES
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left h-auto p-4 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                        onClick={() => navigate('/proyectos/nuevo')}
                      >
                        <div className="flex items-center gap-3">
                          <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium">[+ Crear Proyecto]</span>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left h-auto p-4 hover:bg-green-50 dark:hover:bg-green-500/10"
                        onClick={() => navigate('/proyectos')}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="font-medium">[ Ver Proyectos]</span>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left h-auto p-4 hover:bg-purple-50 dark:hover:bg-purple-500/10"
                        onClick={() => navigate('/perfil')}
                      >
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <span className="font-medium">[ Mi Perfil]</span>
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* ACTIVIDAD RECIENTE */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-orange-500" />
                        ACTIVIDAD RECIENTE
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {userProjects.length > 0 ? (
                        <>
                          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <p className="font-medium text-slate-800 dark:text-white">
                              {userProjects[0]?.name || 'Landing Page'}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Última: {formatDate(userProjects[0]?.updated_at || userProjects[0]?.created_at || '')}
                            </p>
                          </div>
                          <button 
                            onClick={() => navigateToProjects('filter', 'recent_activity')}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            [Ver detalles]
                          </button>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-slate-500 dark:text-slate-400">No hay actividad reciente</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Columna Derecha */}
              <div className="space-y-4 sm:space-y-6">
                {/* INFORMACIÓN RELEVANTE */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-green-500" />
                        INFORMACIÓN RELEVANTE
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-white mb-2">Próximas Entregas</h4>
                        <div className="space-y-2">
                          {userProjects.length > 0 ? (
                            userProjects.slice(0, 2).map((project, index) => (
                              <div key={project.id} className="flex items-center gap-2">
                                <span className="text-slate-500">•</span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                  {project.name}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  ({getProjectStatus(project)})
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">•</span>
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                Landing Page
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                (Sin iniciar)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Notificaciones */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-500" />
                        Notificaciones
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">•</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            Sin mensajes
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">•</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {dashboardStats.totalComments} alertas
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Vista de proyectos cuando no hay proyectos */}
          {!hasValidProjects ? (
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="bg-white rounded-2xl p-12 text-center shadow-xl border border-slate-200/50 relative overflow-hidden">
                {/* Fondo con gradiente sutil */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30"></div>
                
                {/* Elementos decorativos flotantes */}
                <div className="absolute top-8 left-8 w-16 h-16 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full opacity-20 animate-float"></div>
                <div className="absolute top-16 right-12 w-12 h-12 bg-gradient-to-br from-emerald-200 to-teal-300 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-16 left-16 w-20 h-20 bg-gradient-to-br from-violet-200 to-purple-300 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
                
                {/* Contenido principal */}
                <div className="relative z-10 space-y-6">
                  {/* Ilustración personalizada */}
                  <div className="relative">
                    <div className="w-32 h-32 mx-auto mb-6 relative">
                      {/* Cohete principal */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-full flex items-center justify-center shadow-2xl animate-float">
                        <div className="text-white text-4xl">🚀</div>
                      </div>
                      
                      {/* Estela del cohete */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-gradient-to-t from-orange-400 via-yellow-400 to-transparent animate-pulse"></div>
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gradient-to-t from-red-400 via-orange-400 to-transparent animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                      
                      {/* Partículas espaciales */}
                      <div className="absolute top-4 -right-2 w-2 h-2 bg-yellow-300 rounded-full animate-bounce"></div>
                      <div className="absolute top-8 -left-3 w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute bottom-8 -right-4 w-1 h-1 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                    </div>
                  </div>
                  
                  {/* Texto principal */}
                  <div className="space-y-4">
                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white bg-gradient-to-r from-primary to-primary/80 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                      {t('No tienes proyectos aún')}
                    </h3>
                    <p className="text-muted-foreground dark:text-slate-300 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                      {t('Comienza creando tu primer proyecto web y verás el progreso en tiempo real.')}
                    </p>
                  </div>
                  
                  {/* Botón mejorado */}
                  <div className="pt-4">
                    <Button 
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 dark:hover:from-blue-400 dark:hover:via-indigo-400 dark:hover:to-purple-500 text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl dark:shadow-2xl transform hover:-translate-y-1 hover:scale-105 border-0 relative overflow-hidden group"
                      onClick={() => navigate('/proyectos/nuevo')}
                    >
                      {/* Efecto de brillo */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                      
                      <Plus className="h-5 w-5 mr-3 relative z-10" />
                      <span className="relative z-10">{t('Crear mi primer proyecto')}</span>
                    </Button>
                  </div>
                  
                  {/* Información adicional */}
                  <div className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                      <div className="flex flex-col items-center space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Target className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-medium text-blue-700">Planifica</span>
                      </div>
                      <div className="flex flex-col items-center space-y-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Activity className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-medium text-emerald-700">Desarrolla</span>
                      </div>
                      <div className="flex flex-col items-center space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <Award className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-medium text-purple-700">Lanza</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Modal de detalle del proyecto */}
          {isModalOpen && modalInitialized && selectedProject && selectedProject.id && hasValidProjects && (
            <VerDetallesProyecto
              proyecto={selectedProject}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedProject(null);
                setModalInitialized(false);
              }}
              onUpdate={(updatedProject) => {
                // Actualizar el proyecto en el estado local
                setRealTimeProjects(prev => 
                  prev.map(p => p.id === updatedProject.id ? updatedProject : p)
                );
                updateProject(updatedProject.id, updatedProject);
              }}
            />
          )}

          {/* Modal de Colaboración */}
          <ProjectCollaborationModal
            isOpen={showCollaborationModal}
            onClose={() => setShowCollaborationModal(false)}
            projects={userProjects.map(project => ({
              ...project,
              progress: calculateProjectProgress(project)
            }))}
          />
          </div>
        </div>
      </div>
    </>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
