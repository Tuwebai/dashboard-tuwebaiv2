import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { projectService } from '@/lib/projectService';
import { Project, CreateProjectData, UpdateProjectData, ProjectFilters, ProjectSort } from '@/types/project.types';
import { toast } from '@/hooks/use-toast';

export const useProjects = () => {
  const { user } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [sort, setSort] = useState<ProjectSort>({ field: 'created_at', direction: 'desc' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Cargar proyectos
  const loadProjects = useCallback(async () => {
    if (!user || user.role !== 'admin') return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await projectService.getProjects(
        filters,
        sort,
        pagination.page,
        pagination.limit
      );

      setProjects(result.projects);
      setPagination(prev => ({
        ...prev,
        total: result.total,
        totalPages: result.totalPages
      }));
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Error al cargar los proyectos');
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proyectos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, filters, sort, pagination.page, pagination.limit]);

  // Crear proyecto
  const createProject = useCallback(async (projectData: CreateProjectData): Promise<Project | null> => {
    if (!user || user.role !== 'admin') {
      toast({
        title: 'Error',
        description: 'No tienes permisos para crear proyectos',
        variant: 'destructive'
      });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // Validar datos
      const validation = projectService.validateProjectData(projectData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        toast({
          title: 'Error de validación',
          description: validation.errors.join(', '),
          variant: 'destructive'
        });
        return null;
      }

      const newProject = await projectService.createProject({
        ...projectData,
        user_role: user.role
      });
      
      // Actualizar lista
      setProjects(prev => [newProject, ...prev]);
      
      toast({
        title: 'Éxito',
        description: 'Proyecto creado correctamente'
      });

      return newProject;
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Error al crear el proyecto');
      toast({
        title: 'Error',
        description: 'No se pudo crear el proyecto',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Actualizar proyecto
  const updateProject = useCallback(async (id: string, projectData: UpdateProjectData): Promise<Project | null> => {
    if (!user || user.role !== 'admin') {
      toast({
        title: 'Error',
        description: 'No tienes permisos para actualizar proyectos',
        variant: 'destructive'
      });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const updatedProject = await projectService.updateProject(id, projectData);
      
      // Actualizar lista
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      
      toast({
        title: 'Éxito',
        description: 'Proyecto actualizado correctamente'
      });

      return updatedProject;
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Error al actualizar el proyecto');
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el proyecto',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Eliminar proyecto
  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') {
      toast({
        title: 'Error',
        description: 'No tienes permisos para eliminar proyectos',
        variant: 'destructive'
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      await projectService.deleteProject(id);
      
      // Actualizar lista
      setProjects(prev => prev.filter(p => p.id !== id));
      
      toast({
        title: 'Éxito',
        description: 'Proyecto eliminado correctamente'
      });

      return true;
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Error al eliminar el proyecto');
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el proyecto',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Obtener proyecto por ID
  const getProjectById = useCallback(async (id: string): Promise<Project | null> => {
    try {
      setLoading(true);
      setError(null);

      const project = await projectService.getProjectById(id);
      return project;
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Error al cargar el proyecto');
      toast({
        title: 'Error',
        description: 'No se pudo cargar el proyecto',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cambiar página
  const changePage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // Cambiar límite
  const changeLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  // Aplicar filtros
  const applyFilters = useCallback((newFilters: ProjectFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Aplicar ordenamiento
  const applySort = useCallback((newSort: ProjectSort) => {
    setSort(newSort);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({});
    setSort({ field: 'created_at', direction: 'desc' });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Cargar proyectos al montar el componente o cambiar dependencias
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    loading,
    error,
    filters,
    sort,
    pagination,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    changePage,
    changeLimit,
    applyFilters,
    applySort,
    clearFilters,
    reload: loadProjects
  };
};
