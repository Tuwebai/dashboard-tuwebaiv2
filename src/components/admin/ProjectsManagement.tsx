import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, FolderOpen } from 'lucide-react';
import { StorageService } from '@/lib/storageService';
import { useProjects } from '@/hooks/useProjects';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/project.types';
import { ProjectForm } from './ProjectForm';
import { ProjectFiltersComponent } from './ProjectFilters';
import ProjectCard from '@/components/ProjectCard';
import { ProjectDetails } from './ProjectDetails';
import { ProjectPagination } from './ProjectPagination';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

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

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
    setProjectToDelete(project);
    setShowConfirmDelete(true);
    }
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

  const handleUpdateDevelopmentImage = async (projectId: string, imageFile: File) => {
    try {
      // Mostrar toast de carga
      toast({
        title: "📤 Subiendo imagen...",
        description: "Por favor espera mientras se sube la imagen.",
      });

      // Asegurar que el bucket existe
      const bucketExists = await StorageService.ensureBucketExists();
      if (!bucketExists) {
        throw new Error('No se pudo crear el bucket de almacenamiento');
      }

      // Subir la imagen a Supabase Storage
      const uploadResult = await StorageService.uploadImage(imageFile, projectId, user?.id || '');
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Error al subir la imagen');
      }

      // Actualizar el proyecto con la nueva URL de la imagen
      const result = await updateProject(projectId, { screenshot_url: uploadResult.url });
      
      if (result) {
        toast({
          title: "✅ Imagen actualizada",
          description: "La imagen de desarrollo se ha actualizado correctamente.",
        });
      } else {
        throw new Error('No se pudo actualizar la imagen en el proyecto');
      }
    } catch (error: any) {
      console.error('Error updating development image:', error);
      
      toast({
        title: "❌ Error",
        description: `No se pudo actualizar la imagen: ${error?.message || 'Error desconocido'}`,
        variant: "destructive",
      });
    }
  };

  const handleDuplicateProject = async (project: any) => {
    try {
      const duplicateData = {
        name: `${project.name} (Copia)`,
        description: project.description,
        type: project.category,
        status: 'pending',
        progress: 0,
        created_by: user?.id,
        user_role: user?.role
      };
      
      await createProject(duplicateData);
      
      toast({
        title: "✅ Proyecto duplicado",
        description: "El proyecto se ha duplicado correctamente.",
      });
    } catch (error: any) {
      console.error('Error duplicating project:', error);
      
      toast({
        title: "❌ Error",
        description: `No se pudo duplicar el proyecto: ${error?.message || 'Error desconocido'}`,
        variant: "destructive",
      });
    }
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    try {
      const result = await updateProject(projectId, { name: newName });
      
      if (result) {
        toast({
          title: "✅ Proyecto renombrado",
          description: "El proyecto se ha renombrado correctamente.",
        });
      } else {
        throw new Error('No se pudo renombrar el proyecto');
      }
    } catch (error: any) {
      console.error('Error renaming project:', error);
      
      toast({
        title: "❌ Error",
        description: `No se pudo renombrar el proyecto: ${error?.message || 'Error desconocido'}`,
        variant: "destructive",
      });
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
      {/* Header con estilo moderno */}
      <div className="bg-card dark:bg-slate-800/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 dark:border-slate-700/20 backdrop-blur-sm">
      <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
        <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground dark:text-slate-100">Gestión de Proyectos</h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">Administra los proyectos del sistema</p>
            </div>
        </div>
        <Button
          onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
        </div>
      </div>

      {/* Filtros con estilo moderno */}
      <div className="bg-card dark:bg-slate-800/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 dark:border-slate-700/20 backdrop-blur-sm">
      <ProjectFiltersComponent
        filters={filters}
        sort={sort}
        onFiltersChange={applyFilters}
        onSortChange={applySort}
        onClearFilters={clearFilters}
      />
      </div>

      {/* Error con estilo moderno */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Lista de proyectos */}
      {projects.length === 0 ? (
        <div className="bg-card dark:bg-slate-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 dark:border-slate-700/20 backdrop-blur-sm">
          <div className="p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No hay proyectos registrados
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Comienza creando tu primer proyecto para gestionar tus desarrollos.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 active:scale-95"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Proyecto
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Grid de proyectos con el mismo estilo que la card del cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={{
                  id: project.id,
                  name: project.name,
                  category: project.type || 'Web',
                  description: project.description || 'Sin descripción disponible',
                  status: project.status === 'completed' ? 'completed' as const : 'in-progress' as const,
                  progress: project.progress || 0,
                  screenshotUrl: project.screenshot_url,
                  results: {
                    satisfaction: project.satisfaction || 0,
                    originality: project.originality || 0,
                    extras: project.extras || []
                  },
                  phases: project.phases || []
                }}
                user={user}
                onViewProject={handleViewProject}
                onNavigateToCollaboration={handleCollaborate}
                onNavigateToEdit={handleEditProject}
                onDeleteProject={handleDeleteProject}
                onDuplicateProject={handleDuplicateProject}
                onToggleFavorite={() => {}}
                onArchiveProject={() => {}}
                onUpdateDevelopmentImage={handleUpdateDevelopmentImage}
                onRenameProject={handleRenameProject}
                showAdminActions={true}
                index={index}
              />
            ))}
          </div>

          {/* Paginación con estilo moderno */}
          <div className="bg-card dark:bg-slate-800/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 dark:border-slate-700/20 backdrop-blur-sm">
          <ProjectPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={changePage}
            onItemsPerPageChange={changeLimit}
          />
          </div>
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
      <ConfirmationDialog
        isOpen={showConfirmDelete}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirmar eliminación"
        description={`¿Estás seguro de que quieres eliminar el proyecto "${projectToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
                variant="destructive"
        loading={false}
      />
    </div>
  );
};
