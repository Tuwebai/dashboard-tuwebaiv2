import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';


import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Download, 
  BarChart3, 
  Grid, 
  List,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  FileText,
  Users,
  CheckSquare,
  User
} from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import SearchAndFilters from '@/components/SearchAndFilters';
import ProjectMetrics from '@/components/ProjectMetrics';

import { exportProjects, exportCompleteReport } from '@/utils/exportUtils';
import { ErrorMessage } from '@/components/ErrorBoundary';
import { SectionSpinner } from '@/components/LoadingSpinner';
import { useDebounce } from '@/hooks/usePerformance';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import ProyectosNuevo from './ProyectosNuevo';
import { formatDateSafe } from '@/utils/formatDateSafe';
import { userService } from '@/lib/supabaseService';
import VerDetallesProyecto from '@/components/VerDetallesProyecto';
import ProjectCard from '@/components/ProjectCard';

const ProjectsPage = React.memo(() => {
  const { projects, loading, error, refreshData, user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams<{ userId?: string }>();
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');


  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [urlFilters, setUrlFilters] = useState<Record<string, string>>({});
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectCreators, setProjectCreators] = useState<Record<string, { full_name: string; email: string }>>({});
  const [targetUserName, setTargetUserName] = useState<string>('');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Mostrar proyectos según el contexto:
  // - Si hay userId en la URL: mostrar solo proyectos de ese usuario
  // - Si es admin sin userId: mostrar todos los proyectos
  // - Si es usuario normal sin userId: mostrar solo sus proyectos
  const visibleProjects = useMemo(() => {
    return userId 
      ? projects.filter(p => p.created_by === userId)
      : user.role === 'admin'
        ? projects
        : projects.filter(p => p.created_by === user.id);
  }, [projects, userId, user.role, user.id]);

  // Leer parámetros de URL y aplicar filtros automáticamente
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const filters: Record<string, string> = {};
    
    // Leer todos los parámetros de la URL
    for (const [key, value] of searchParams.entries()) {
      filters[key] = value;
    }
    
    setUrlFilters(filters);
    
    // Aplicar filtros automáticamente
    let filtered = [...visibleProjects];
    
    if (filters.view) {
      switch (filters.view) {
        case 'progress':
          // Filtrar por proyectos con progreso
          filtered = filtered.filter(p => p.progress && p.progress > 0);
          break;
        case 'tasks':
          // Filtrar por proyectos con tareas
          filtered = filtered.filter(p => p.phases && p.phases.some(phase => phase.tasks && phase.tasks.length > 0));
          break;
        case 'summary':
          // Mostrar todos los proyectos para resumen
          break;
      }
    }
    
    if (filters.status) {
      switch (filters.status) {
        case 'in_progress':
          filtered = filtered.filter(p => p.status === 'in_progress');
          break;
        case 'completed':
          filtered = filtered.filter(p => p.status === 'completed');
          break;
        case 'pending':
          filtered = filtered.filter(p => p.status === 'pending');
          break;
      }
    }
    
    if (filters.type) {
      switch (filters.type) {
        case 'collaborative':
          filtered = filtered.filter(p => p.collaborators && p.collaborators.length > 0);
          break;
        case 'personal':
          filtered = filtered.filter(p => !p.collaborators || p.collaborators.length === 0);
          break;
      }
    }
    
    if (filters.filter) {
      switch (filters.filter) {
        case 'comments':
          // Filtrar por proyectos con comentarios recientes
          filtered = filtered.filter(p => p.phases && p.phases.some(phase => phase.comments && phase.comments.length > 0));
          break;
        case 'recent_activity':
          // Filtrar por actividad reciente (últimos 7 días)
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          filtered = filtered.filter(p => new Date(p.updated_at) > weekAgo);
          break;
        case 'notifications':
          // Filtrar por proyectos con notificaciones
          filtered = filtered.filter(p => p.notifications && p.notifications.length > 0);
          break;
      }
    }
    
    setFilteredProjects(filtered);
  }, [location.search, visibleProjects]);

  // Actualizar proyectos filtrados cuando cambien los proyectos o el usuario
  useEffect(() => {
    setFilteredProjects(visibleProjects);
  }, [visibleProjects]);

  // Cargar información del usuario objetivo cuando se pase un userId
  useEffect(() => {
    const loadTargetUserInfo = async () => {
      if (userId && userId !== user.id) {
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', userId)
            .single();
          
          if (userData && !error) {
            setTargetUserName(userData.full_name || userData.email || 'Usuario');
          }
        } catch (error) {
          console.error('Error cargando información del usuario:', error);
          setTargetUserName('Usuario');
        }
      }
    };

    loadTargetUserInfo();
  }, [userId, user.id]);

  // Función para manejar proyectos filtrados desde SearchAndFilters
  const handleFilteredProjects = useCallback((filtered: any[]) => {
    setFilteredProjects(filtered);
  }, []);

  // Limpiar estado cuando se desmonte el componente
  useEffect(() => {
    return () => {
      setFilteredProjects([]);
      setSearchTerm('');
      setSortBy('updatedAt');
      setSortOrder('desc');
      setShowNuevoModal(false);
      setSelectedProject(null);
      setShowProjectModal(false);
    };
  }, []);

  // Función para cargar información de los creadores de proyectos
  const loadProjectCreators = useCallback(async (projects: any[]) => {
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
      // Error cargando creadores de proyectos
    }
  }, []);

  // Cargar información de creadores cuando cambien los proyectos
  useEffect(() => {
    if (visibleProjects.length > 0) {
      loadProjectCreators(visibleProjects);
    }
  }, [visibleProjects, loadProjectCreators]);

  // SOLUCIÓN NUCLEAR: Forzar re-renderizado cuando cambie la ruta
  useEffect(() => {
    const handleRouteChange = () => {
      // Forzar re-renderizado del componente
      setFilteredProjects([...filteredProjects]);
    };

    // Escuchar cambios de ruta
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [filteredProjects]);







  // Función para exportar proyectos
  const handleExport = useCallback((projectsToExport: any[]) => {
    try {
      exportProjects(projectsToExport);
      toast({
        title: 'Exportación exitosa',
        description: 'Los proyectos han sido exportados correctamente.'
      });
    } catch (error) {
      toast({
        title: 'Error en la exportación',
        description: 'No se pudieron exportar los proyectos.',
        variant: 'destructive'
      });
    }
  }, []);

  // Función para exportar reporte completo
  const handleExportReport = useCallback(() => {
    try {
      exportCompleteReport(user, projects);
      toast({
        title: 'Reporte exportado',
        description: 'El reporte completo ha sido exportado correctamente.'
      });
    } catch (error) {
      toast({
        title: 'Error en la exportación',
        description: 'No se pudo exportar el reporte.',
        variant: 'destructive'
      });
    }
  }, [user, projects]);

  // Funciones para cambio de vista
  const handleViewModeGrid = useCallback(() => setViewMode('grid'), []);
  const handleViewModeList = useCallback(() => setViewMode('list'), []);

  // Funciones para modales
  const handleOpenNuevoModal = useCallback(() => setShowNuevoModal(true), []);
  const handleCloseNuevoModal = useCallback(() => setShowNuevoModal(false), []);

  // Funciones de navegación
  const handleNavigateToEdit = useCallback((projectId: string) => navigate(`/proyectos/${projectId}`), [navigate]);
  const handleNavigateToCollaboration = useCallback((projectId: string) => navigate(`/proyectos/${projectId}/colaboracion-cliente`), [navigate]);
  
  // Función para ver detalles del proyecto
  const handleViewProject = useCallback((project: any) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  }, []);



    // Función para eliminar proyecto
  const handleDeleteProject = useCallback(async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    if (user.role !== 'admin' && project.created_by !== user.id) {
      toast({
        title: 'Sin permisos',
        description: 'Solo el dueño o un admin puede borrar este proyecto.',
        variant: 'destructive'
      });
      return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId);
        
        if (error) throw error;
        
        toast({
          title: 'Proyecto eliminado',
          description: 'El proyecto ha sido eliminado correctamente.'
        });
        await refreshData();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el proyecto.',
          variant: 'destructive'
      });
      }
    }
  }, [projects, user.role, user.email, refreshData]);

  // Funciones para quick actions
  const handleDuplicateProject = useCallback((project: any) => {
    // Aquí implementarías la lógica de duplicación
    toast({ title: 'Duplicado', description: `Proyecto "${project.name}" duplicado correctamente.` });
  }, []);

  const handleToggleFavorite = useCallback((projectId: string) => {
    // Aquí implementarías la lógica de favoritos
    toast({ title: 'Favorito', description: 'Proyecto marcado como favorito.' });
  }, []);

  const handleArchiveProject = useCallback((projectId: string) => {
    // Aquí implementarías la lógica de archivado
    toast({ title: 'Archivado', description: 'Proyecto archivado correctamente.' });
  }, []);

  if (loading) return <SectionSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refreshData} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header con diseño claro */}
        <div className="bg-card dark:bg-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-border/50 dark:border-slate-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                {userId ? `Proyectos de ${targetUserName}` : 'Mis Proyectos'}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 sm:mt-2">
                {userId 
                  ? `Proyectos creados por ${targetUserName}`
                  : 'Gestiona y monitorea todos tus proyectos en un solo lugar'
                }
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {userId && (
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="border-border text-foreground hover:bg-muted/50 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">← Volver</span>
                  <span className="sm:hidden">←</span>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleExportReport}
                className="border-border text-foreground hover:bg-muted/50 text-xs sm:text-sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Exportar Reporte</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
              {!userId && (
                <Button 
                  onClick={handleOpenNuevoModal}
                  className="bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-lg text-white font-medium text-xs sm:text-sm"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Nuevo Proyecto</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Métricas de Proyectos */}
        <ProjectMetrics 
          projects={visibleProjects} 
          loading={loading}
        />

        {/* Búsqueda y filtros */}
        <div className="bg-card dark:bg-slate-800/50 rounded-2xl shadow-lg border border-border/50 dark:border-slate-700/50">
          <SearchAndFilters
            projects={visibleProjects}
            onFilteredProjects={handleFilteredProjects}
            onExport={handleExport}
            onRefresh={refreshData}
          />
        </div>

        {/* Controles de vista */}
        <div className="bg-card dark:bg-slate-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-border/50 dark:border-slate-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={handleViewModeGrid}
                className={`${viewMode === 'grid' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'border-border text-foreground hover:bg-muted/50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50'} h-8 w-8 sm:h-9 sm:w-9`}
              >
                <Grid className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={handleViewModeList}
                className={`${viewMode === 'list' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'border-border text-foreground hover:bg-muted/50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50'} h-8 w-8 sm:h-9 sm:w-9`}
              >
                <List className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <span className="hidden sm:inline">Mostrando {filteredProjects.length} de {projects.length} proyectos</span>
              <span className="sm:hidden">{filteredProjects.length}/{projects.length}</span>
              {Object.keys(urlFilters).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
                  {Object.entries(urlFilters).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {key}: {value}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de proyectos */}
        {filteredProjects.length === 0 ? (
          <div className="bg-card dark:bg-slate-800/50 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center shadow-lg border border-border/50 dark:border-slate-700/50">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-slate-800 dark:text-white">No hay proyectos</h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-3 sm:mb-4">
              {projects.length === 0 
                ? 'Comienza creando tu primer proyecto'
                : 'No se encontraron proyectos con los filtros aplicados'
              }
            </p>
            {projects.length === 0 && (
              <Button 
                onClick={handleOpenNuevoModal}
                className="bg-gradient-to-r from-blue-500 via-purple-600 hover:to-fuchsia-700 shadow-lg text-white font-medium text-sm sm:text-base"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Crear primer proyecto</span>
                <span className="sm:hidden">Crear proyecto</span>
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6' : 'space-y-3 sm:space-y-4'}>
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={{
                  id: project.id,
                  name: project.name,
                  category: project.type || 'Web',
                  description: project.description || 'Sin descripción disponible',
                  status: (() => {
                    const progress = project.fases ? Math.round((project.fases.filter((f: any) => f.estado === 'Terminado').length / project.fases.length) * 100) : 0;
                    return progress === 100 ? 'completed' as const : 'in-progress' as const;
                  })(),
                  progress: project.fases ? Math.round((project.fases.filter((f: any) => f.estado === 'Terminado').length / project.fases.length) * 100) : 0,
                  screenshotUrl: undefined,
                  results: (() => {
                    const progress = project.fases ? Math.round((project.fases.filter((f: any) => f.estado === 'Terminado').length / project.fases.length) * 100) : 0;
                    if (progress < 100) return undefined;
                    
                    const projectType = project.type || 'Web';
                    const baseResults = {
                      satisfaction: Math.floor(Math.random() * 20) + 80,
                      originality: Math.floor(Math.random() * 15) + 85,
                      extras: []
                    };
                    
                    switch (projectType.toLowerCase()) {
                      case 'ecommerce':
                      case 'tienda online':
                        baseResults.extras = ['Sistema de pagos integrado', 'Gestión de inventario', 'Panel de administración', 'Optimización SEO', 'Diseño responsive'];
                        break;
                      case 'landing page':
                      case 'landing':
                        baseResults.extras = ['Diseño conversión optimizado', 'Formularios de contacto', 'Integración analytics', 'Optimización móvil', 'Carga rápida'];
                        break;
                      default:
                        baseResults.extras = ['Diseño moderno', 'Código optimizado', 'Documentación completa', 'Testing exhaustivo', 'Deploy automatizado'];
                    }
                    
                    return baseResults;
                  })(),
                  phases: project.fases ? project.fases.map((fase: any) => ({
                    name: fase.key.charAt(0).toUpperCase() + fase.key.slice(1).replace(/([A-Z])/g, ' $1'),
                    status: fase.estado === 'Terminado' ? 'Completado' as const :
                            fase.estado === 'En Progreso' ? 'En curso' as const :
                            'Pendiente' as const,
                    description: fase.descripcion
                  })) : []
                }}
                user={user}
                projectCreators={projectCreators}
                onViewProject={handleViewProject}
                onNavigateToCollaboration={handleNavigateToCollaboration}
                onNavigateToEdit={handleNavigateToEdit}
                onDeleteProject={handleDeleteProject}
                onDuplicateProject={handleDuplicateProject}
                onToggleFavorite={handleToggleFavorite}
                onArchiveProject={handleArchiveProject}
                showAdminActions={user?.role === 'admin'}
                index={index}
              />
            ))}
          </div>
        )}



        {/* Modal de nuevo proyecto */}
        {showNuevoModal && (
          <ProyectosNuevo />
        )}

        {/* Modal de detalles del proyecto */}
        {showProjectModal && selectedProject && (
          <VerDetallesProyecto
            proyecto={selectedProject}
            onClose={() => {
              setShowProjectModal(false);
              setSelectedProject(null);
            }}
            onUpdate={(updatedProject) => {
              // Actualizar el proyecto en el estado local si es necesario
              setShowProjectModal(false);
              setSelectedProject(null);
            }}
          />
        )}
      </div>
    </div>
  );
});

ProjectsPage.displayName = 'ProjectsPage';

export default ProjectsPage;
