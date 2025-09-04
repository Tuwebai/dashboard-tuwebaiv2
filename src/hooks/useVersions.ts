import React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { versionService } from '@/lib/versionService';
import { ProjectVersion, Environment, VersionFilters, VersionSort, ChangeLog } from '@/types/project.types';
import { useToast } from '@/hooks/use-toast';

export const useVersions = (projectId: string) => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  // Estados
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VersionFilters>({});
  const [sort, setSort] = useState<VersionSort>({ field: 'createdAt', direction: 'desc' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Cargar versiones
  const loadVersions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const result = await versionService.getVersions(projectId, filters, sort, pagination.page, pagination.limit);

      // Asegurar que el resultado sea válido
      if (result && Array.isArray(result.versions)) {
        setVersions(result.versions);
        setPagination(prev => ({
          ...prev,
          total: result.total || 0,
          totalPages: result.totalPages || 0
        }));
      } else {
        setVersions([]);
        setPagination(prev => ({
          ...prev,
          total: 0,
          totalPages: 0
        }));
      }
    } catch (err) {
      console.error('Error loading versions:', err);
      setError('Error al cargar las versiones');
      setVersions([]);
      setPagination(prev => ({
        ...prev,
        total: 0,
        totalPages: 0
      }));
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las versiones',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, projectId, filters, sort, pagination.page, pagination.limit]);

  // Cargar entornos
  const loadEnvironments = useCallback(async () => {
    if (!user) return;

    try {
      const envs = await versionService.getEnvironments(projectId);
      
      // Asegurar que el resultado sea válido
      if (Array.isArray(envs)) {
        setEnvironments(envs);
      } else {
        setEnvironments([]);
      }
    } catch (err) {
      console.error('Error loading environments:', err);
      setEnvironments([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los entornos',
        variant: 'destructive'
      });
    }
  }, [user, projectId]);

  // Crear versión
  const createVersion = useCallback(async (versionData: {
    version: string;
    description: string;
    changes: Omit<ChangeLog, 'id' | 'timestamp'>[];
    environment: 'development' | 'staging' | 'production';
    commitHash?: string;
    branch?: string;
  }): Promise<ProjectVersion | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes estar autenticado para crear versiones',
        variant: 'destructive'
      });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // Validar datos
      const validation = versionService.validateVersionData(versionData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        toast({
          title: 'Error de validación',
          description: validation.errors.join(', '),
          variant: 'destructive'
        });
        return null;
      }

      const newVersion = await versionService.createVersion(projectId, versionData);
      
      // Actualizar lista
      setVersions(prev => [newVersion, ...prev]);
      
      toast({
        title: 'Éxito',
        description: 'Versión creada correctamente'
      });

      return newVersion;
    } catch (err) {
      console.error('Error creating version:', err);
      setError('Error al crear la versión');
      toast({
        title: 'Error',
        description: 'No se pudo crear la versión',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  // Actualizar versión
  const updateVersion = useCallback(async (versionId: string, updates: Partial<ProjectVersion>): Promise<ProjectVersion | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes estar autenticado para actualizar versiones',
        variant: 'destructive'
      });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const updatedVersion = await versionService.updateVersion(versionId, updates);
      
      // Actualizar lista
      setVersions(prev => prev.map(v => v.id === versionId ? updatedVersion : v));
      
      toast({
        title: 'Éxito',
        description: 'Versión actualizada correctamente'
      });

      return updatedVersion;
    } catch (err) {
      console.error('Error updating version:', err);
      setError('Error al actualizar la versión');
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la versión',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Eliminar versión
  const deleteVersion = useCallback(async (versionId: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes estar autenticado para eliminar versiones',
        variant: 'destructive'
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      await versionService.deleteVersion(versionId);
      
      // Actualizar lista
      setVersions(prev => prev.filter(v => v.id !== versionId));
      
      toast({
        title: 'Éxito',
        description: 'Versión eliminada correctamente'
      });

      return true;
    } catch (err) {
      console.error('Error deleting version:', err);
      setError('Error al eliminar la versión');
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la versión',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Crear entorno
  const createEnvironment = useCallback(async (environmentData: {
    name: 'development' | 'staging' | 'production';
    displayName: string;
    description: string;
    url?: string;
    autoDeploy?: boolean;
    branch: string;
    healthCheckUrl?: string;
  }): Promise<Environment | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes estar autenticado para crear entornos',
        variant: 'destructive'
      });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const newEnvironment = await versionService.createEnvironment(projectId, environmentData);
      
      // Actualizar lista
      setEnvironments(prev => [...prev, newEnvironment]);
      
      toast({
        title: 'Éxito',
        description: 'Entorno creado correctamente'
      });

      return newEnvironment;
    } catch (err) {
      console.error('Error creating environment:', err);
      setError('Error al crear el entorno');
      toast({
        title: 'Error',
        description: 'No se pudo crear el entorno',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  // Cambiar página
  const changePage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // Cambiar límite
  const changeLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  // Aplicar filtros
  const applyFilters = useCallback((newFilters: VersionFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Aplicar ordenamiento
  const applySort = useCallback((newSort: VersionSort) => {
    setSort(newSort);
  }, []);

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Recargar datos
  const reload = useCallback(() => {
    loadVersions();
    loadEnvironments();
  }, [loadVersions, loadEnvironments]);

  // Cargar datos iniciales
  useEffect(() => {
    loadVersions();
    loadEnvironments();
  }, [loadVersions, loadEnvironments]);

  return {
    // Estado
    versions,
    environments,
    loading,
    error,
    filters,
    sort,
    pagination,

    // Acciones
    createVersion,
    updateVersion,
    deleteVersion,
    createEnvironment,
    changePage,
    changeLimit,
    applyFilters,
    applySort,
    clearFilters,
    reload,

    // Utilidades
    getLatestVersion: (environment: 'development' | 'staging' | 'production') => 
      versions.find(v => v.environment === environment && v.status === 'deployed'),
    
    getEnvironmentByName: (name: 'development' | 'staging' | 'production') => 
      environments.find(e => e.name === name)
  };
};
