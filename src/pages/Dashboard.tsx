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
  TrendingDown,
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
  HelpCircle,
  Heart,
  Shield,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
  Circle
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

// Componente Sparkline para mini-gráficos
const Sparkline = ({ data, color = "blue", size = "sm" }: { data: number[], color?: string, size?: "sm" | "md" | "lg" }) => {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const width = size === "sm" ? 60 : size === "md" ? 80 : 100;
  const height = size === "sm" ? 20 : size === "md" ? 24 : 30;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  const colorClasses = {
    blue: "stroke-blue-500",
    green: "stroke-green-500", 
    orange: "stroke-orange-500",
    purple: "stroke-purple-500",
    red: "stroke-red-500"
  };
  
  return (
    <div className="flex items-center justify-center">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} opacity-80`}
        />
        <circle
          cx={width - 2}
          cy={height - ((data[data.length - 1] - min) / range) * height}
          r="2"
          fill="currentColor"
          className={`${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}
        />
      </svg>
    </div>
  );
};

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
  
  @keyframes countUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
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
    animation: countUp 0.6s ease-out;
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

  // Estadísticas calculadas con datos para sparklines
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

    // Calcular indicador de salud general
    const healthScore = totalProjects > 0 ? Math.round(
      (completedProjects * 100 + inProgressProjects * 60 + pendingProjects * 20) / totalProjects
    ) : 0;

    // Generar datos para sparklines (simulando tendencias de los últimos 7 días)
    const generateSparklineData = (baseValue: number, variance: number = 0.2) => {
      return Array.from({ length: 7 }, (_, i) => {
        const randomFactor = (Math.random() - 0.5) * variance;
        return Math.max(0, Math.round(baseValue * (1 + randomFactor)));
      });
    };

    // Quick stats adicionales
    const thisMonthProjects = userProjects.filter(p => {
      const projectDate = new Date(p.created_at || p.createdAt || '');
      const now = new Date();
      return projectDate.getMonth() === now.getMonth() && projectDate.getFullYear() === now.getFullYear();
    }).length;

    const averageTimeToComplete = completedProjects > 0 
      ? Math.round(userProjects
          .filter(p => getProjectStatus(p) === 'Completado')
          .reduce((acc, p) => {
            const created = new Date(p.created_at || p.createdAt || '');
            const updated = new Date(p.updated_at || '');
            return acc + (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // días
          }, 0) / completedProjects)
      : 0;

    const activeCollaborations = userProjects.filter(p => 
      p.fases?.some(f => f.comentarios?.some(c => c.tipo === 'admin'))
    ).length;

    return {
      totalProjects,
      inProgressProjects,
      completedProjects,
      pendingProjects,
      totalComments,
      averageProgress,
      recentActivity,
      healthScore,
      thisMonthProjects,
      averageTimeToComplete,
      activeCollaborations,
      sparklines: {
        projects: generateSparklineData(totalProjects, 0.3),
        progress: generateSparklineData(averageProgress, 0.4),
        comments: generateSparklineData(totalComments, 0.5),
        health: generateSparklineData(healthScore, 0.2)
      }
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
      <div className="w-full bg-slate-50 dark:bg-slate-900 transition-all duration-300">
        <div className="w-full">
          <div className="w-full">
          


          {/* ZONA 2: MÉTRICAS CLAVE REDISEÑADAS */}
          <div className="px-4 sm:px-4 lg:px-8 py-6 sm:py-4 lg:py-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6 sm:space-y-6"
            >
              {/* Métricas Principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Proyectos Totales */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="group cursor-pointer"
                >
                  <div 
                    onClick={() => navigate('/proyectos')}
                    className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-right">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                          {dashboardStats.totalProjects}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Proyectos</div>
                      </div>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-slate-500 dark:text-slate-500">Este mes:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{dashboardStats.thisMonthProjects}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <Sparkline data={dashboardStats.sparklines.projects} color="blue" size="sm" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Progreso Promedio */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="group cursor-pointer"
                >
                  <div 
                    onClick={() => navigateToProjects('view', 'progress')}
                    className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-right">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                          {dashboardStats.averageProgress}%
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Progreso</div>
                      </div>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-slate-500 dark:text-slate-500">Completados:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{dashboardStats.completedProjects}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <Sparkline data={dashboardStats.sparklines.progress} color="green" size="sm" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Tareas Activas */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="group cursor-pointer"
                >
                  <div 
                    onClick={() => navigate('/fases-tareas')}
                    className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="text-right">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                          {userProjects.reduce((acc, p) => acc + (p.fases?.filter(f => f.estado === 'Pendiente' || f.estado === 'En Progreso').length || 0), 0)}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Tareas</div>
                      </div>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-slate-500 dark:text-slate-500">En progreso:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{dashboardStats.inProgressProjects}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <Sparkline data={dashboardStats.sparklines.comments} color="orange" size="sm" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Colaboración */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="group cursor-pointer"
                >
                  <div 
                    onClick={() => setShowCollaborationModal(true)}
                    className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-right">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                          {dashboardStats.activeCollaborations}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Activas</div>
                      </div>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-slate-500 dark:text-slate-500">Comentarios:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{dashboardStats.totalComments}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-1">
                          <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                          <span className="text-xs text-slate-500 dark:text-slate-500">En línea</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

            </motion.div>
          </div>

          {/* ZONA 3A: ACCIONES PRINCIPALES E INFORMACIÓN RELEVANTE REDISEÑADAS */}
          <div className="px-4 sm:px-0 lg:px-8 py-12 sm:py-8 lg:py-10" style={{ 
            paddingLeft: window.innerWidth < 1024 ? '1rem' : '2rem', 
            paddingRight: window.innerWidth < 1024 ? '1rem' : '2rem' 
          }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-5 lg:gap-6">
              {/* ACCIONES PRINCIPALES */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Acciones Principales</h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Gestiona tus proyectos</p>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <button
                      className="w-full group p-3 sm:p-4 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => navigate('/proyectos/nuevo')}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Crear Proyecto</div>
                          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Inicia un nuevo proyecto web</div>
                        </div>
                        <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      </div>
                    </button>
                    
                    <button
                      className="w-full group p-3 sm:p-4 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => navigate('/proyectos')}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Ver Proyectos</div>
                          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Gestiona tus proyectos existentes</div>
                        </div>
                        <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                      </div>
                    </button>
                    
                    <button
                      className="w-full group p-3 sm:p-4 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => navigate('/perfil')}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Mi Perfil</div>
                          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Configura tu cuenta</div>
                        </div>
                        <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* INFORMACIÓN RELEVANTE */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className=""
              >
                <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Información Relevante</h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Estado de tus proyectos</p>
                    </div>
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        Próximas Entregas
                      </h4>
                      <div className="space-y-3">
                        {userProjects.length > 0 ? (
                          userProjects.slice(0, 2).map((project, index) => (
                            <motion.div 
                              key={project.id} 
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600"
                            >
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <div className="flex-1">
                                <div className="font-medium text-slate-900 dark:text-white text-sm">
                                  {project.name}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                  {getProjectStatus(project)} • {calculateProjectProgress(project)}%
                                </div>
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-500">
                                {formatDate(project.created_at || project.createdAt || '')}
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 dark:text-white text-sm">
                                Landing Page
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">
                                Sin iniciar • 0%
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ZONA 3B: ACTIVIDAD RECIENTE Y NOTIFICACIONES REDISEÑADAS */}
          <div className="px-4 sm:px-0 lg:px-8 pb-12 sm:pb-8 lg:pb-10" style={{ 
            paddingLeft: window.innerWidth < 1024 ? '1rem' : '2rem', 
            paddingRight: window.innerWidth < 1024 ? '1rem' : '2rem' 
          }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-5 lg:gap-6">
              {/* ACTIVIDAD RECIENTE */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Actividad Reciente</h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Últimas actualizaciones</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {userProjects.length > 0 ? (
                      <>
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 1.0 }}
                          className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-700"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                {userProjects[0]?.name || 'Landing Page'}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                Última actualización: {formatDate(userProjects[0]?.updated_at || userProjects[0]?.created_at || '')}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-full">
                                  {getProjectStatus(userProjects[0])}
                                </div>
                                <div className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-full">
                                  {calculateProjectProgress(userProjects[0])}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                        <button 
                          onClick={() => navigateToProjects('filter', 'recent_activity')}
                          className="w-full text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium flex items-center justify-center gap-2 p-3 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Eye className="h-4 w-4" />
                          Ver detalles de actividad
                        </button>
                      </>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 1.0 }}
                        className="text-center py-8"
                      >
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Activity className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">No hay actividad reciente</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Crea tu primer proyecto para ver actividad</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Notificaciones */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="-mt-1"
              >
                <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Notificaciones</h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Alertas y mensajes</p>
                    </div>
                  </div>
                  <div className="space-y-3 sm:space-y-4 flex-1">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 1.1 }}
                      className="space-y-2 sm:space-y-3 flex-1"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                            Sistema operativo
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Todos los servicios funcionando correctamente
                          </p>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          Ahora
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-600">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                            {dashboardStats.totalComments} comentarios
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Nuevos mensajes en tus proyectos
                          </p>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          Reciente
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-600">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div className="flex-1">
                          <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                            {dashboardStats.pendingProjects} proyectos pendientes
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Requieren tu atención
                          </p>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          Pendiente
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
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
