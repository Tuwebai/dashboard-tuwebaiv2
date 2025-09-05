import React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
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

export default function ProjectsPage() {
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
      <div className="p-6 space-y-6">
        {/* Header con diseño claro */}
        <div className="bg-card dark:bg-slate-800/50 rounded-2xl p-6 shadow-lg border border-border/50 dark:border-slate-700/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                {userId ? `Proyectos de ${targetUserName}` : 'Mis Proyectos'}
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                {userId 
                  ? `Proyectos creados por ${targetUserName}`
                  : 'Gestiona y monitorea todos tus proyectos en un solo lugar'
                }
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {userId && (
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="border-border text-foreground hover:bg-muted/50"
                >
                  ← Volver
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleExportReport}
                className="border-border text-foreground hover:bg-muted/50"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Reporte
              </Button>
              {!userId && (
                <Button 
                  onClick={handleOpenNuevoModal}
                  className="bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-lg text-white font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Proyecto
                </Button>
              )}
            </div>
          </div>
        </div>



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
        <div className="bg-card dark:bg-slate-800/50 rounded-2xl p-4 shadow-lg border border-border/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={handleViewModeGrid}
                className={viewMode === 'grid' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'border-border text-foreground hover:bg-muted/50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50'}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={handleViewModeList}
                className={viewMode === 'list' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'border-border text-foreground hover:bg-muted/50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50'}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Mostrando {filteredProjects.length} de {projects.length} proyectos
            </div>
          </div>
        </div>

        {/* Lista de proyectos */}
        {filteredProjects.length === 0 ? (
          <div className="bg-card dark:bg-slate-800/50 rounded-2xl p-12 text-center shadow-lg border border-border/50 dark:border-slate-700/50">
            <div className="w-16 h-16 bg-muted dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">No hay proyectos</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {projects.length === 0 
                ? 'Comienza creando tu primer proyecto'
                : 'No se encontraron proyectos con los filtros aplicados'
              }
            </p>
            {projects.length === 0 && (
              <Button 
                onClick={handleOpenNuevoModal}
                className="bg-gradient-to-r from-blue-500 via-purple-600 hover:to-fuchsia-700 shadow-lg text-white font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear primer proyecto
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'flex flex-wrap gap-6' : 'space-y-4'}>
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
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
}
