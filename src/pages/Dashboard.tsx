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
          
          {/* Botón Crear Proyecto */}
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-start">
              <Button
                onClick={() => navigate('/proyectos/nuevo')}
                className="bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
              >
                <Plus className="h-6 w-6 mr-3" />
                Crear Proyecto
              </Button>
            </div>
          </div>


          {/* Layout en 3 Columnas - Nuevo Dashboard del Cliente */}
          <div className="px-4 sm:px-6 lg:px-8 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Columna Izquierda - Acciones Rápidas (30%) */}
              <div className="lg:col-span-3 space-y-6">
                {/* Acciones Rápidas */}
            <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-500" />
                        Acciones Rápidas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left h-auto p-4 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                        onClick={() => navigate('/proyectos/nuevo')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">Nuevo Proyecto</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Crear un proyecto web</p>
                </div>
                </div>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left h-auto p-4 hover:bg-green-50 dark:hover:bg-green-500/10"
                        onClick={() => navigate('/proyectos')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">Ver Proyectos</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Gestionar existentes</p>
                </div>
              </div>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left h-auto p-4 hover:bg-purple-50 dark:hover:bg-purple-500/10"
                        onClick={() => navigate('/perfil')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">Mi Perfil</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Configurar cuenta</p>
                          </div>
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
            </motion.div>

                {/* Estado del Equipo */}
            <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-500" />
                        Estado del Equipo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">Equipo Activo</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Trabajando en tus proyectos</p>
                </div>
                </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">Comunicación</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Respuesta en 2-4 horas</p>
                  </div>
                </div>
                    </CardContent>
                  </Card>
            </motion.div>
              </div>

              {/* Columna Central - Contenido Principal (50%) */}
              <div className="lg:col-span-6 space-y-6">
                {/* Métricas Mejoradas para el Cliente */}
            <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {/* Progreso de Mis Proyectos */}
                  <Card 
                    className="bg-gradient-to-br from-blue-500/10 via-blue-600/15 to-indigo-500/20 dark:from-blue-500/20 dark:via-blue-600/25 dark:to-indigo-500/30 border border-blue-200/50 dark:border-blue-500/30 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={() => navigateToProjects('view', 'progress')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <BarChart3 className="h-6 w-6 text-white" />
                </div>
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                          {dashboardStats.averageProgress}% Promedio
                        </Badge>
                </div>
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                        Progreso de Mis Proyectos
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                          <span>Progreso General</span>
                          <span>{dashboardStats.averageProgress}%</span>
                </div>
                        <Progress value={dashboardStats.averageProgress} className="h-2" />
                </div>
                    </CardContent>
                  </Card>

                  {/* Próximas Entregas */}
                  <Card 
                    className="bg-gradient-to-br from-orange-500/10 via-orange-600/15 to-red-500/20 dark:from-orange-500/20 dark:via-orange-600/25 dark:to-red-500/30 border border-orange-200/50 dark:border-orange-500/30 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={() => navigateToProjects('status', 'in_progress')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Calendar className="h-6 w-6 text-white" />
                </div>
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                          Próximas
                        </Badge>
              </div>
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                        Próximas Entregas
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                          <span>En Progreso</span>
                          <span>{dashboardStats.inProgressProjects} proyectos</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Revisa el timeline de cada proyecto
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comunicación Activa */}
                  <Card 
                    className="bg-gradient-to-br from-green-500/10 via-green-600/15 to-emerald-500/20 dark:from-green-500/20 dark:via-green-600/25 dark:to-emerald-500/30 border border-green-200/50 dark:border-green-500/30 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={() => setShowCollaborationModal(true)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300">
                          {dashboardStats.totalComments} Mensajes
                        </Badge>
                </div>
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                        Comunicación Activa
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                          <span>Comentarios Totales</span>
                          <span>{dashboardStats.totalComments}</span>
                </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Mantente al día con el equipo
                </div>
                </div>
                    </CardContent>
                  </Card>

                  {/* Estado de Colaboración */}
                  <Card 
                    className="bg-gradient-to-br from-purple-500/10 via-purple-600/15 to-violet-500/20 dark:from-purple-500/20 dark:via-purple-600/25 dark:to-violet-500/30 border border-purple-200/50 dark:border-purple-500/30 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={() => navigateToProjects('type', 'collaborative')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Users className="h-6 w-6 text-white" />
                  </div>
                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                          Activo
                        </Badge>
                </div>
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                        Estado de Colaboración
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                          <span>Proyectos Colaborativos</span>
                          <span>{dashboardStats.totalProjects}</span>
              </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Trabajo en equipo activo
          </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Timeline de Actividad Reciente */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Card 
                    className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300"
                    onClick={() => navigateToProjects('filter', 'recent_activity')}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        Actividad Reciente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userProjects.slice(0, 3).map((project, index) => (
                          <div key={project.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                              <span className="text-white font-bold text-sm">
                                {project.name?.charAt(0) || 'P'}
                              </span>
                    </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-800 dark:text-white">
                                {project.name}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                Última actualización: {formatDate(project.updated_at)}
                              </p>
                  </div>
                            <Badge variant="outline" className="text-xs">
                              {getProjectStatus(project)}
                            </Badge>
                </div>
                        ))}
                  </div>
                    </CardContent>
                  </Card>
                </motion.div>
                </div>
                
              {/* Columna Derecha - Tareas y Notificaciones (20%) */}
              <div className="lg:col-span-3 space-y-6">
                {/* Tareas Personales */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card 
                    className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300"
                    onClick={() => navigate('/fases-tareas')}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Mis Tareas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Revisar propuesta de diseño</span>
                  </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Aprobar contenido final</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Responder feedback del equipo</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Notificaciones Importantes */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card 
                    className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300"
                    onClick={() => navigateToProjects('filter', 'notifications')}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-500" />
                        Notificaciones
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            Nuevo mensaje del equipo
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Hace 2 horas
                          </p>
                    </div>
                        <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20">
                          <p className="text-sm font-medium text-green-800 dark:text-green-300">
                            Proyecto actualizado
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Hace 4 horas
                          </p>
                  </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Resumen Semanal */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Card 
                    className="bg-gradient-to-br from-indigo-500/10 via-purple-500/15 to-pink-500/20 dark:from-indigo-500/20 dark:via-purple-500/25 dark:to-pink-500/30 border border-indigo-200/50 dark:border-indigo-500/30 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300"
                    onClick={() => navigateToProjects('view', 'summary')}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-500" />
                        Resumen Semanal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                          {dashboardStats.averageProgress}%
                </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Progreso General
                        </p>
              </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-300">Proyectos Activos</span>
                          <span className="font-medium text-slate-800 dark:text-white">{dashboardStats.totalProjects}</span>
                </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-300">Comentarios</span>
                          <span className="font-medium text-slate-800 dark:text-white">{dashboardStats.totalComments}</span>
                </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-300">Completados</span>
                          <span className="font-medium text-slate-800 dark:text-white">{dashboardStats.completedProjects}</span>
              </div>
                      </div>
                    </CardContent>
                  </Card>
            </motion.div>
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
            

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

      {/* Modal de Colaboración */}
      <ProjectCollaborationModal
        isOpen={showCollaborationModal}
        onClose={() => setShowCollaborationModal(false)}
        projects={userProjects.map(project => ({
          ...project,
          progress: calculateProjectProgress(project)
        }))}
      />

    </>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
