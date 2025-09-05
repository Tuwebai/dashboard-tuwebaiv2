import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
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
  Archive,
  Trash2,
  Copy,
  GripVertical,
  Keyboard,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { formatDateSafe } from '@/utils/formatDateSafe';
import VerDetallesProyecto from '@/components/VerDetallesProyecto';
import ProjectCard from '@/components/ProjectCard';
import LazyProjectCard from '@/components/LazyProjectCard';
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
  estado: 'Pendiente' | 'En Progreso' | 'Terminado';
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
  
  // Configurar actualizaciones en tiempo real
  const { refreshProjects } = useRealtimeProjects();
  const [comentarioInput, setComentarioInput] = useState<Record<string, string>>({});
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [dragMode, setDragMode] = useState(false);
  const [projectOrder, setProjectOrder] = useState<string[]>([]);
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

    // Si hay orden personalizado (drag & drop), aplicarlo
    if (dragMode && projectOrder.length > 0) {
      const orderedProjects = projectOrder
        .map(id => filtered.find(p => p.id === id))
        .filter(Boolean) as Project[];
      
      // Agregar proyectos que no están en el orden personalizado
      const remainingProjects = filtered.filter(p => !projectOrder.includes(p.id));
      return [...orderedProjects, ...remainingProjects];
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
  }, [userProjects, searchTerm, statusFilter, sortBy, sortOrder, dragMode, projectOrder]);

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

  // Función para ver detalles del proyecto
  const handleViewProject = (project: Project) => {
    if (project && project.id) {
      setSelectedProject(project);
      setIsModalOpen(true);
      setModalInitialized(true);
    } else {
      // Proyecto inválido
      toast({ 
        title: 'Error', 
        description: 'No se pudo cargar la información del proyecto.', 
        variant: 'destructive' 
      });
    }
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

  // Funciones para bulk actions
  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedProjects.size === filteredAndSortedProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredAndSortedProjects.map(p => p.id)));
    }
  }, [selectedProjects.size, filteredAndSortedProjects]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedProjects.size === 0) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar ${selectedProjects.size} proyecto(s)? Esta acción no se puede deshacer.`)) {
      try {
        // Aquí implementarías la lógica de eliminación en lote
        toast({ title: 'Eliminados', description: `${selectedProjects.size} proyecto(s) eliminados correctamente.` });
        setSelectedProjects(new Set());
        setBulkActionMode(false);
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudieron eliminar los proyectos.', variant: 'destructive' });
      }
    }
  }, [selectedProjects]);

  const handleBulkArchive = useCallback(async () => {
    if (selectedProjects.size === 0) return;
    
    try {
      // Aquí implementarías la lógica de archivado en lote
      toast({ title: 'Archivados', description: `${selectedProjects.size} proyecto(s) archivados correctamente.` });
      setSelectedProjects(new Set());
      setBulkActionMode(false);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron archivar los proyectos.', variant: 'destructive' });
    }
  }, [selectedProjects]);

  const handleDuplicateProject = useCallback((project: Project) => {
    // Aquí implementarías la lógica de duplicación
    toast({ title: 'Duplicado', description: `Proyecto "${project.name}" duplicado correctamente.` });
  }, []);

  const handleToggleFavorite = useCallback((project: Project) => {
    // Aquí implementarías la lógica de favoritos
    toast({ title: 'Favorito', description: `Proyecto "${project.name}" marcado como favorito.` });
  }, []);

  const handleArchiveProject = useCallback((project: Project) => {
    // Aquí implementarías la lógica de archivado
    toast({ title: 'Archivado', description: `Proyecto "${project.name}" archivado correctamente.` });
  }, []);

  // Funciones para drag & drop
  const handleToggleDragMode = useCallback(() => {
    setDragMode(prev => !prev);
    if (!dragMode) {
      // Inicializar orden con el orden actual
      setProjectOrder(filteredAndSortedProjects.map(p => p.id));
    } else {
      // Limpiar orden personalizado
      setProjectOrder([]);
    }
  }, [dragMode, filteredAndSortedProjects]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const newOrder = Array.from(projectOrder);
    const [reorderedItem] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedItem);

    setProjectOrder(newOrder);
    
    toast({
      title: 'Orden actualizado',
      description: 'Los proyectos han sido reordenados por prioridad',
    });
  }, [projectOrder]);

  // Funciones para keyboard shortcuts
  const handleSearchFocus = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Configurar keyboard shortcuts
  const keyboardShortcuts = useKeyboardShortcuts({
    onToggleDragMode: handleToggleDragMode,
    onClearFilters: clearFilters,
    onExportData: exportDashboardData,
    onCreateProject: handleCreateProject,
    onRefreshData: refreshData,
    onToggleBulkMode: () => setBulkActionMode(!bulkActionMode),
    onSelectAll: handleSelectAll,
    onSearchFocus: handleSearchFocus,
    isDragMode: dragMode,
    isBulkMode: bulkActionMode,
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
          


          {/* Cards de Estadísticas Principales */}
          <div className="metrics-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            
            {/* Card Proyectos Totales */}
            <motion.div 
              className="relative group cursor-pointer card-hover-effect"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-card dark:bg-slate-800/50 rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl dark:shadow-2xl dark:shadow-blue-500/20 dark:hover:shadow-3xl dark:hover:shadow-blue-500/30 transition-all duration-500 transform hover:-translate-y-2 border border-border/50 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-primary/15 dark:from-blue-500/30 dark:via-blue-600/35 dark:to-blue-700/40 relative">
                {/* Efecto de brillo sutil */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Efecto de brillo adicional para modo oscuro - Azul */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-blue-400/30 to-blue-600/20 opacity-0 dark:opacity-100 group-hover:opacity-100 dark:group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Icono mejorado con animación flotante */}
                <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mb-4 shadow-2xl group-hover:scale-110 transition-all duration-500 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white animate-float relative overflow-hidden">
                  <Target size={28} className="sm:w-8 sm:h-8 relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
                
                {/* Valor con animación mejorada */}
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-card-foreground dark:text-white mb-3 group-hover:scale-105 transition-transform duration-300 metric-value-animation bg-gradient-to-r from-primary to-primary/80 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                  {dashboardStats.totalProjects}
                </div>
                
                {/* Título con mejor tipografía */}
                <div className="text-lg sm:text-xl font-bold text-card-foreground dark:text-white mb-2 flex items-center gap-2">
                  Proyectos Activos
                  <ContextualHelp 
                    context="proyectos" 
                    position="top" 
                    trigger="hover"
                  />
                </div>
                
                {/* Subtítulo con icono */}
                <div className="text-sm text-muted-foreground dark:text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-400 rounded-full animate-pulse"></div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {dashboardStats.inProgressProjects}
                  </span>
                  <span>en progreso</span>
                </div>
                
                {/* Efecto de partículas flotantes */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce mt-1" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>

            {/* Card En Progreso */}
            <motion.div 
              className="relative group cursor-pointer card-hover-effect"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-card dark:bg-slate-800/50 rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl dark:shadow-2xl dark:shadow-emerald-500/20 dark:hover:shadow-3xl dark:hover:shadow-emerald-500/30 transition-all duration-500 transform hover:-translate-y-2 border border-border/50 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-emerald-500/5 via-green-500/10 to-teal-500/15 dark:from-emerald-500/30 dark:via-green-600/35 dark:to-teal-600/40 relative">
                {/* Efecto de brillo sutil */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Efecto de brillo adicional para modo oscuro - Verde */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-green-400/30 to-teal-500/20 opacity-0 dark:opacity-100 group-hover:opacity-100 dark:group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Icono mejorado con animación de progreso */}
                <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mb-4 shadow-2xl group-hover:scale-110 transition-all duration-500 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 text-white animate-pulse-glow relative overflow-hidden">
                  <Activity size={28} className="sm:w-8 sm:h-8 relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
                
                {/* Valor con animación mejorada */}
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-card-foreground dark:text-white mb-3 group-hover:scale-105 transition-transform duration-300 metric-value-animation bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-400 dark:to-teal-500 bg-clip-text text-transparent">
                  {dashboardStats.inProgressProjects}
                </div>
                
                {/* Título con mejor tipografía */}
                <div className="text-lg sm:text-xl font-bold text-card-foreground dark:text-white mb-2">
                  En Progreso
                </div>
                
                {/* Subtítulo con icono */}
                <div className="text-sm text-muted-foreground dark:text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-500 dark:from-blue-500 dark:to-indigo-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {dashboardStats.pendingProjects}
                  </span>
                  <span>pendientes</span>
                </div>
                
                {/* Indicador de progreso animado */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="w-8 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full overflow-hidden">
                    <div className="h-full bg-white/30 animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card Comentarios */}
            <motion.div 
              className="relative group cursor-pointer card-hover-effect"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-card dark:bg-slate-800/50 rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl dark:shadow-2xl dark:shadow-amber-500/20 dark:hover:shadow-3xl dark:hover:shadow-amber-500/30 transition-all duration-500 transform hover:-translate-y-2 border border-border/50 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-amber-500/5 via-yellow-500/10 to-orange-500/15 dark:from-amber-500/30 dark:via-yellow-600/35 dark:to-orange-600/40 relative">
                {/* Efecto de brillo sutil */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Efecto de brillo adicional para modo oscuro - Naranja */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-yellow-400/30 to-orange-500/20 opacity-0 dark:opacity-100 group-hover:opacity-100 dark:group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Icono mejorado con animación de chat */}
                <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mb-4 shadow-2xl group-hover:scale-110 transition-all duration-500 bg-gradient-to-br from-amber-500 via-yellow-600 to-orange-700 text-white animate-float relative overflow-hidden">
                  <MessageSquare size={28} className="sm:w-8 sm:h-8 relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  
                  {/* Indicador de mensaje animado */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                
                {/* Valor con animación mejorada */}
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-card-foreground dark:text-white mb-3 group-hover:scale-105 transition-transform duration-300 metric-value-animation bg-gradient-to-r from-amber-600 to-orange-700 dark:from-amber-400 dark:to-orange-500 bg-clip-text text-transparent">
                  {dashboardStats.totalComments}
                </div>
                
                {/* Título con mejor tipografía */}
                <div className="text-lg sm:text-xl font-bold text-card-foreground dark:text-white mb-2">
                  Comentarios
                </div>
                
                {/* Subtítulo con icono */}
                <div className="text-sm text-muted-foreground dark:text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {dashboardStats.completedProjects}
                  </span>
                  <span>completados</span>
                </div>
                
                {/* Burbujas de chat flotantes */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 space-y-1">
                  <div className="w-3 h-3 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2.5 h-2.5 bg-yellow-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>

            {/* Card Progreso General */}
            <motion.div 
              className="relative group cursor-pointer card-hover-effect"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-card dark:bg-slate-800/50 rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl dark:shadow-2xl dark:shadow-violet-500/20 dark:hover:shadow-3xl dark:hover:shadow-violet-500/30 transition-all duration-500 transform hover:-translate-y-2 border border-border/50 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-violet-500/5 via-purple-500/10 to-fuchsia-500/15 dark:from-violet-500/30 dark:via-purple-600/35 dark:to-fuchsia-600/40 relative">
                {/* Efecto de brillo sutil */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Efecto de brillo adicional para modo oscuro - Violeta */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-purple-400/30 to-fuchsia-500/20 opacity-0 dark:opacity-100 group-hover:opacity-100 dark:group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Icono mejorado con animación de crecimiento */}
                <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mb-4 shadow-2xl group-hover:scale-110 transition-all duration-500 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-700 text-white animate-pulse-glow relative overflow-hidden">
                  <TrendingUp size={28} className="sm:w-8 sm:h-8 relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  
                  {/* Líneas de tendencia animadas */}
                  <div className="absolute inset-0 flex items-end justify-center space-x-1 opacity-20">
                    <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-7 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                  </div>
                </div>
                
                {/* Valor con animación mejorada */}
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-card-foreground dark:text-white mb-3 group-hover:scale-105 transition-transform duration-300 metric-value-animation bg-gradient-to-r from-violet-600 to-fuchsia-700 dark:from-violet-400 dark:to-fuchsia-500 bg-clip-text text-transparent">
                  {dashboardStats.averageProgress}%
                </div>
                
                {/* Título con mejor tipografía */}
                <div className="text-lg sm:text-xl font-bold text-card-foreground dark:text-white mb-2">
                  Progreso General
                </div>
                
                {/* Subtítulo con icono */}
                <div className="text-sm text-muted-foreground dark:text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {dashboardStats.completedProjects}
                  </span>
                  <span>finalizados</span>
                </div>
                
                {/* Barra de progreso circular */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="w-8 h-8 rounded-full border-2 border-violet-300 relative">
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" style={{ animationDuration: '2s' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>


          {/* Contenido Principal */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
            
            {/* Filtros y Controles */}
            <motion.div 
              className="bg-card dark:bg-slate-800/50 rounded-2xl p-6 sm:p-8 shadow-xl border border-border/50 dark:border-slate-700/50 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Fondo con gradiente sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-muted/20 via-primary/5 to-primary/10"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Filter className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-card-foreground dark:text-white bg-gradient-to-r from-primary to-primary/80 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                      Filtros y Controles
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="border-border dark:border-slate-600 text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-700 hover:border-primary dark:hover:border-blue-500 hover:text-primary dark:hover:text-blue-400 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                </div>

                {/* Barra de búsqueda */}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <div className="relative flex-1 lg:flex-none lg:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Buscar proyectos... (Ctrl+F)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-popover border-border text-slate-800 placeholder-slate-500 focus:border-blue-400 focus:ring-blue-400 transition-all duration-300 shadow-sm hover:shadow-md"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                  {/* Filtro por estado */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    <Label className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Estado:
                    </Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-36 bg-input border-border text-foreground hover:border-emerald-400 hover:ring-emerald-400 transition-all duration-300 shadow-sm hover:shadow-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Sin iniciar">Sin iniciar</SelectItem>
                        <SelectItem value="En progreso">En progreso</SelectItem>
                        <SelectItem value="En progreso avanzado">En progreso avanzado</SelectItem>
                        <SelectItem value="Completado">Completado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ordenamiento */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    <Label className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                      <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                      Ordenar por:
                    </Label>
                    <div className="flex items-center gap-3">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-36 bg-input border-border text-foreground hover:border-violet-400 hover:ring-violet-400 transition-all duration-300 shadow-sm hover:shadow-md">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="recent">Más Recientes</SelectItem>
                          <SelectItem value="name">Nombre</SelectItem>
                          <SelectItem value="progress">Progreso</SelectItem>
                          <SelectItem value="status">Estado</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="border-slate-300 text-card-foreground hover:bg-slate-50 hover:border-violet-400 hover:text-violet-700 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Actualizar */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshProjects}
                    className="border-border text-foreground hover:bg-muted hover:border-primary hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 w-full sm:w-auto"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>

                  {/* Exportar */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportDashboardData}
                    className="border-border text-foreground hover:bg-muted hover:border-orange-400 hover:text-orange-700 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
              
              {/* Información de filtros aplicados */}
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground dark:text-slate-300">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 dark:bg-slate-700/50 rounded-lg border border-border dark:border-slate-600">
                  <div className="w-2 h-2 bg-primary dark:bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="font-medium text-foreground dark:text-white">Mostrando {filteredAndSortedProjects.length} de {userProjects.length} proyectos</span>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 dark:bg-green-500/30 rounded-lg border border-green-500/20 dark:border-green-500/50">
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium text-green-600 dark:text-green-300">Actualizaciones en tiempo real activas</span>
                </div>
                
                {searchTerm && (
                  <Badge variant="outline" className="bg-gradient-to-r from-primary/10 to-primary/20 dark:from-blue-500/30 dark:to-blue-600/40 text-primary dark:text-blue-200 border-primary/30 dark:border-blue-500/60 px-3 py-1.5 shadow-sm hover:shadow-md dark:shadow-blue-500/20 dark:hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105">
                    <Search className="h-3 w-3 mr-1" />
                    Búsqueda: "{searchTerm}"
                  </Badge>
                )}
                
                {statusFilter !== 'all' && (
                  <Badge variant="outline" className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/30 dark:to-teal-500/40 text-emerald-700 dark:text-emerald-200 border-emerald-300 dark:border-emerald-500/60 px-3 py-1.5 shadow-sm hover:shadow-md dark:shadow-emerald-500/20 dark:hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105">
                    <Activity className="h-3 w-3 mr-1" />
                    Estado: {statusFilter}
                  </Badge>
                )}
                
                <Badge variant="outline" className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-500/30 dark:to-purple-500/40 text-violet-700 dark:text-violet-200 border-violet-300 dark:border-violet-500/60 px-3 py-1.5 shadow-sm hover:shadow-md dark:shadow-violet-500/20 dark:hover:shadow-violet-500/30 transition-all duration-300 hover:scale-105">
                  <SortAsc className="h-3 w-3 mr-1" />
                  Orden: {dragMode ? 'Personalizado' : sortBy === 'recent' ? 'Más Recientes' : sortBy === 'name' ? 'Nombre' : sortBy === 'progress' ? 'Progreso' : 'Estado'}
                </Badge>
                
                {dragMode && (
                  <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/30 dark:to-indigo-500/40 text-blue-700 dark:text-blue-200 border-blue-300 dark:border-blue-500/60 px-3 py-1.5 shadow-sm hover:shadow-md dark:shadow-blue-500/20 dark:hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105 animate-pulse">
                    <GripVertical className="h-3 w-3 mr-1" />
                    Modo Arrastrar Activo
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* Barra de Bulk Actions */}
            {bulkActionMode && selectedProjects.size > 0 && (
              <motion.div 
                className="bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-4 shadow-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{selectedProjects.size}</span>
                      </div>
                      <span className="font-semibold text-blue-800 dark:text-blue-200">
                        {selectedProjects.size} proyecto{selectedProjects.size > 1 ? 's' : ''} seleccionado{selectedProjects.size > 1 ? 's' : ''}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                    >
                      {selectedProjects.size === filteredAndSortedProjects.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkArchive}
                      className="border-orange-300 dark:border-orange-500/40 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archivar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Vista de proyectos */}
            {!hasValidProjects ? (
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
            ) : (
              <div className="space-y-6">
                {/* Indicador de modo drag */}
                {dragMode && (
                  <motion.div 
                    className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-lg"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <GripVertical className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-semibold text-blue-800 dark:text-blue-200">
                            Modo Arrastrar Activo
                          </span>
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                          Arrastra los proyectos para reordenarlos por prioridad. Presiona ESC o Ctrl+D para salir.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleDragMode}
                        className="border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                      >
                        Salir
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Contenedor de proyectos con drag & drop */}
                {dragMode ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="projects" direction="horizontal">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex flex-wrap gap-6 p-4 rounded-2xl transition-all duration-300 ${
                            snapshot.isDraggingOver 
                              ? 'bg-blue-50 dark:bg-blue-500/10 border-2 border-dashed border-blue-300 dark:border-blue-500/40' 
                              : 'bg-transparent'
                          }`}
                        >
                          {filteredAndSortedProjects.filter(project => project && project.id).map((project, index) => (
                            <LazyProjectCard
                              key={project.id}
                              project={project}
                              user={user}
                              projectCreators={projectCreators}
                              onViewProject={handleViewProject}
                              onDeleteProject={handleDeleteProject}
                              onNavigateToCollaboration={(projectId) => {
                                const url = `/proyectos/${projectId}/colaboracion-cliente`;
                                try {
                                  navigate(url);
                                } catch (error) {
                                  toast({ 
                                    title: 'Error de navegación', 
                                    description: 'No se pudo navegar a la página de colaboración', 
                                    variant: 'destructive' 
                                  });
                                }
                              }}
                              onNavigateToEdit={(project) => {
                                const url = `/proyectos/${project.id}/editar`;
                                try {
                                  navigate(url);
                                } catch (error) {
                                  toast({ 
                                    title: 'Error de navegación', 
                                    description: 'No se pudo navegar a la página de edición.',
                                    variant: 'destructive' 
                                  });
                                }
                              }}
                              onDuplicateProject={handleDuplicateProject}
                              onToggleFavorite={handleToggleFavorite}
                              onArchiveProject={handleArchiveProject}
                              index={index}
                              dragMode={true}
                              isDragDisabled={false}
                            />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  <div className="projects-section flex flex-wrap gap-6">
                    {filteredAndSortedProjects.filter(project => project && project.id).map((project, index) => (
                      <LazyProjectCard
                        key={project.id}
                        project={project}
                        user={user}
                        projectCreators={projectCreators}
                        onViewProject={handleViewProject}
                        onDeleteProject={handleDeleteProject}
                        onNavigateToCollaboration={(projectId) => {
                          const url = `/proyectos/${projectId}/colaboracion-cliente`;
                          try {
                            navigate(url);
                          } catch (error) {
                            toast({ 
                              title: 'Error de navegación', 
                              description: 'No se pudo navegar a la página de colaboración', 
                              variant: 'destructive' 
                            });
                          }
                        }}
                        onNavigateToEdit={(project) => {
                          const url = `/proyectos/${project.id}/editar`;
                          try {
                            navigate(url);
                          } catch (error) {
                            toast({ 
                              title: 'Error de navegación', 
                              description: 'No se pudo navegar a la página de edición.',
                              variant: 'destructive' 
                            });
                          }
                        }}
                        onDuplicateProject={handleDuplicateProject}
                        onToggleFavorite={handleToggleFavorite}
                        onArchiveProject={handleArchiveProject}
                        index={index}
                        dragMode={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

      {/* Actividad Reciente */}
      {hasValidProjects && dashboardStats.recentActivity.length > 0 && (
        <motion.div 
          className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200/50 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Fondo con gradiente sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-amber-50/20 to-orange-50/20"></div>
          
          <div className="relative z-10">
            {/* Header mejorado */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent">
                    Actividad Reciente
                  </h2>
                  <p className="text-slate-600 text-sm">Últimos comentarios y actualizaciones</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-800 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
              >
                <Activity className="h-4 w-4 mr-2" />
                Ver Todo
              </Button>
            </div>
            
            {/* Lista de actividad */}
            <div className="space-y-6">
              {dashboardStats.recentActivity.map((project, index) => {
                const recentComments = project.fases
                  ?.flatMap(f => f.comentarios || [])
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                  .slice(0, 3) || [];

                return (
                  <motion.div 
                    key={project.id} 
                    className="group cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <div className="p-6 border border-slate-200/50 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg hover:border-amber-200 transition-all duration-300 group-hover:scale-[1.02]">
                      {/* Header del proyecto */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-sm">
                              {project.name?.charAt(0) || 'P'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 text-lg group-hover:text-amber-700 transition-colors duration-300">
                              {project.name}
                            </h3>
                            <p className="text-sm text-slate-500">Proyecto activo</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(getProjectStatus(project))} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                          {getProjectStatus(project)}
                        </Badge>
                      </div>
                      
                      {/* Comentarios recientes */}
                      {recentComments.length > 0 ? (
                        <div className="space-y-3">
                          {recentComments.map((comment, commentIndex) => (
                            <motion.div 
                              key={commentIndex} 
                              className="flex items-start gap-4 p-4 bg-gradient-to-r from-slate-50 to-amber-50/30 rounded-lg border border-slate-200/50 hover:border-amber-200 transition-all duration-300 hover:shadow-md"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: commentIndex * 0.1 }}
                            >
                              <Avatar className="h-8 w-8 shadow-sm">
                                <AvatarFallback className="text-xs bg-gradient-to-br from-amber-500 to-orange-600 text-white font-semibold">
                                  {comment.autor?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-semibold text-slate-800 text-sm">
                                    {comment.autor}
                                  </span>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      comment.tipo === 'admin' 
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40 dark:shadow-blue-500/10' 
                                        : 'bg-slate-50 text-card-foreground border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/40 dark:shadow-slate-500/10'
                                    }`}
                                  >
                                    {comment.tipo === 'admin' ? 'Admin' : 'Cliente'}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Clock className="h-3 w-3" />
                                    {formatDateSafe(comment.fecha)}
                                  </div>
                                </div>
                                <p className="text-card-foreground text-sm leading-relaxed group-hover:text-slate-800 transition-colors duration-300">
                                  {comment.texto}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MessageSquare className="h-8 w-8 text-slate-400" />
                          </div>
                          <p className="text-slate-500 italic">No hay comentarios recientes en este proyecto</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}



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
                                           </div>
          </div>
        </div>
      </div>
    </>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
