import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, FolderOpen } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/project.types';
import { ProjectForm } from './ProjectForm';
import { ProjectFiltersComponent } from './ProjectFilters';
import ProjectCard from '@/components/ProjectCard';
import { ProjectDetails } from './ProjectDetails';
import { ProjectPagination } from './ProjectPagination';

export const ProjectsManagement: React.FC = () => {
  const { user } = useApp();
  const { theme } = useTheme();
  const {
    projects,
    loading,
    error,
    filters,
    sort,
    pagination,
    createProject,
    updateProject,
    deleteProject,
    changePage,
    changeLimit,
    applyFilters,
    applySort,
    clearFilters,
    reload
  } = useProjects();

  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleCreateProject = async (data: CreateProjectData) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'Usuario no autenticado',
        variant: 'destructive'
      });
      return;
    }

    setFormLoading(true);
    try {
      // Agregar el ID del usuario creador y su rol
      const projectDataWithCreator = {
        ...data,
        created_by: user.id,
        user_role: user.role
      };
      
      await createProject(projectDataWithCreator);
      setShowForm(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateProject = async (data: UpdateProjectData) => {
    if (!editingProject) return;
    
    setFormLoading(true);
    try {
      await updateProject(editingProject.id, data);
      setEditingProject(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    setProjectToDelete(project);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete.id);
      setShowConfirmDelete(false);
      setProjectToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDelete(false);
    setProjectToDelete(null);
  };

  const handleCollaborate = (project: Project) => {
    // Navegar a la página de colaboración del admin
    window.open(`/proyectos/${project.id}/colaboracion-admin`, '_blank');
  };

  const handleUpdateProjectIcon = async (projectId: string, iconName: string) => {
    try {
      
             const result = await updateProject(projectId, { customicon: iconName });
      
      if (result) {
        toast({
          title: "✅ Icono actualizado",
          description: "El icono del proyecto se ha actualizado correctamente.",
        });
      } else {
        throw new Error('No se pudo actualizar el icono');
      }
    } catch (error: any) {
      console.error('Error updating project icon:', error);
      
      // Mensaje específico si es problema de columna faltante
      if (error?.message?.includes('customicon') || error?.code === 'PGRST116') {
        toast({
          title: "🔧 Configuración Requerida",
          description: "Para personalizar iconos, ejecuta el script SQL en Supabase. Revisa el archivo 'add-customicon-column.sql'",
          variant: "destructive",
        });
      } else if (error?.message?.includes('permission') || error?.code === '42501') {
        toast({
          title: "🚫 Sin Permisos",
          description: "No tienes permisos para actualizar este proyecto.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Error",
          description: `No se pudo actualizar el icono: ${error?.message || 'Error desconocido'}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setViewingProject(null);
  };

  const handleViewProject = (project: Project) => {
    setViewingProject(project);
    setEditingProject(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  const handleCloseDetails = () => {
    setViewingProject(null);
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Gestión de Proyectos</h1>
          <p className="text-slate-600 dark:text-slate-400">Administra los proyectos del sistema</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Filtros */}
      <ProjectFiltersComponent
        filters={filters}
        sort={sort}
        onFiltersChange={applyFilters}
        onSortChange={applySort}
        onClearFilters={clearFilters}
      />

      {/* Error */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Lista de proyectos */}
      {projects.length === 0 ? (
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-8">
            <div className="text-center">
              <FolderOpen className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">
                No hay proyectos registrados
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Comienza creando tu primer proyecto para gestionar tus desarrollos.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Proyecto
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grid de proyectos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                onView={handleViewProject}
                onCollaborate={handleCollaborate}
                onUpdateIcon={handleUpdateProjectIcon}
              />
            ))}
          </div>

          {/* Paginación */}
          <ProjectPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={changePage}
            onItemsPerPageChange={changeLimit}
          />
        </>
      )}

      {/* Formulario de proyecto */}
      {(showForm || editingProject) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <ProjectForm
              project={editingProject || undefined}
              onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
              onCancel={handleCloseForm}
              loading={formLoading}
            />
          </div>
        </div>
      )}

      {/* Vista de detalles */}
      {viewingProject && (
        <ProjectDetails
          project={viewingProject}
          onEdit={handleEditProject}
          onClose={handleCloseDetails}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {showConfirmDelete && projectToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 max-w-sm mx-4 shadow-xl">
            <h3 className="text-slate-800 dark:text-slate-200 font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              ¿Estás seguro de que quieres eliminar el proyecto "{projectToDelete.name}"? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelDelete}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDelete}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
