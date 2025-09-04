import { supabase } from './supabase';
import { 
  ProjectVersion, 
  ChangeLog, 
  Environment, 
  VersionFilters,
  VersionSort
} from '@/types/project.types';

export const versionService = {
  // ===== GESTIÓN DE VERSIONES =====
  
  async getVersions(projectId: string, filters?: VersionFilters, sort?: VersionSort, page = 1, limit = 10) {
    try {
      let query = supabase
        .from('project_versions')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId);

      // Aplicar filtros
      if (filters?.environment) {
        query = query.eq('environment', filters.environment);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      
      if (filters?.search) {
        query = query.or(`version.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Aplicar ordenamiento
      if (sort) {
        const fieldMap: Record<string, string> = {
          'createdAt': 'created_at',
          'updatedAt': 'updated_at',
          'deployedAt': 'deployed_at',
          'version': 'version',
          'status': 'status'
        };
        const dbField = fieldMap[sort.field] || sort.field;
        query = query.order(dbField, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Aplicar paginación
      query = query.range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      // Mapear los datos de la base de datos a la interfaz TypeScript
      const mappedVersions = (data || []).map((version: any) => ({
        id: version.id,
        projectId: version.project_id,
        version: version.version,
        description: version.description,
        changes: version.changes || [],
        deployedAt: version.deployed_at,
        deployedBy: version.deployed_by,
        status: version.status,
        environment: version.environment,
        buildNumber: version.build_number,
        commitHash: version.commit_hash,
        branch: version.branch,
        buildLogs: version.build_logs,
        deploymentLogs: version.deployment_logs,
        rollbackTo: version.rollback_to,
        createdAt: version.created_at,
        updatedAt: version.updated_at
      }));

      return {
        versions: mappedVersions,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error getting versions:', error);
      throw error;
    }
  },

  async createVersion(projectId: string, versionData: {
    version: string;
    description: string;
    changes: Omit<ChangeLog, 'id' | 'timestamp'>[];
    environment: 'development' | 'staging' | 'production';
    commitHash?: string;
    branch?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('project_versions')
        .insert({
          project_id: projectId,
          version: versionData.version,
          description: versionData.description,
          changes: versionData.changes,
          environment: versionData.environment,
          commit_hash: versionData.commitHash,
          branch: versionData.branch,
          status: 'pending',
          build_number: 1
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Mapear los datos de la base de datos a la interfaz TypeScript
      return {
        id: data.id,
        projectId: data.project_id,
        version: data.version,
        description: data.description,
        changes: data.changes || [],
        deployedAt: data.deployed_at,
        deployedBy: data.deployed_by,
        status: data.status,
        environment: data.environment,
        buildNumber: data.build_number,
        commitHash: data.commit_hash,
        branch: data.branch,
        buildLogs: data.build_logs,
        deploymentLogs: data.deployment_logs,
        rollbackTo: data.rollback_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating version:', error);
      throw error;
    }
  },

  async updateVersion(versionId: string, updates: Partial<ProjectVersion>) {
    try {
      const { data, error } = await supabase
        .from('project_versions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', versionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Mapear los datos de la base de datos a la interfaz TypeScript
      return {
        id: data.id,
        projectId: data.project_id,
        version: data.version,
        description: data.description,
        changes: data.changes || [],
        deployedAt: data.deployed_at,
        deployedBy: data.deployed_by,
        status: data.status,
        environment: data.environment,
        buildNumber: data.build_number,
        commitHash: data.commit_hash,
        branch: data.branch,
        buildLogs: data.build_logs,
        deploymentLogs: data.deployment_logs,
        rollbackTo: data.rollback_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating version:', error);
      throw error;
    }
  },

  async deleteVersion(versionId: string) {
    try {
      const { error } = await supabase
        .from('project_versions')
        .delete()
        .eq('id', versionId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting version:', error);
      throw error;
    }
  },

  // ===== GESTIÓN DE ENTORNOS =====

  async getEnvironments(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('environments')
        .select('*')
        .eq('project_id', projectId)
        .order('name');

      if (error) {
        throw error;
      }

      // Mapear los datos de la base de datos a la interfaz TypeScript
      const mappedEnvironments = (data || []).map((environment: any) => ({
        id: environment.id,
        projectId: environment.project_id,
        name: environment.name,
        displayName: environment.display_name,
        description: environment.description,
        url: environment.url,
        isActive: environment.is_active,
        autoDeploy: environment.auto_deploy,
        branch: environment.branch,
        healthCheckUrl: environment.health_check_url,
        createdAt: environment.created_at,
        updatedAt: environment.updated_at
      }));

      return mappedEnvironments;
    } catch (error) {
      console.error('Error getting environments:', error);
      throw error;
    }
  },

  async createEnvironment(projectId: string, environmentData: {
    name: 'development' | 'staging' | 'production';
    displayName: string;
    description: string;
    url?: string;
    autoDeploy: boolean;
    branch: string;
    healthCheckUrl?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('environments')
        .insert({
          project_id: projectId,
          name: environmentData.name,
          display_name: environmentData.displayName,
          description: environmentData.description,
          url: environmentData.url,
          is_active: true,
          auto_deploy: environmentData.autoDeploy,
          branch: environmentData.branch,
          health_check_url: environmentData.healthCheckUrl
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Mapear los datos de la base de datos a la interfaz TypeScript
      return {
        id: data.id,
        projectId: data.project_id,
        name: data.name,
        displayName: data.display_name,
        description: data.description,
        url: data.url,
        isActive: data.is_active,
        autoDeploy: data.auto_deploy,
        branch: data.branch,
        healthCheckUrl: data.health_check_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating environment:', error);
      throw error;
    }
  },

  // ===== VALIDACIÓN =====

  validateVersionData(versionData: any) {
    const errors: string[] = [];

    if (!versionData.version) {
      errors.push('La versión es requerida');
    }

    if (!versionData.description) {
      errors.push('La descripción es requerida');
    }

    if (!versionData.environment) {
      errors.push('El ambiente es requerido');
    }

    if (!versionData.changes || versionData.changes.length === 0) {
      errors.push('Al menos un cambio es requerido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // ===== UTILIDADES =====

  generateVersionNumber(currentVersion: string, type: 'major' | 'minor' | 'patch'): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        return currentVersion;
    }
  },

  async getLatestVersion(projectId: string, environment: 'development' | 'staging' | 'production') {
    try {
      const { data, error } = await supabase
        .from('project_versions')
        .select('*')
        .eq('project_id', projectId)
        .eq('environment', environment)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        throw error;
      }

      // Mapear los datos de la base de datos a la interfaz TypeScript
      return {
        id: data.id,
        projectId: data.project_id,
        version: data.version,
        description: data.description,
        changes: data.changes || [],
        deployedAt: data.deployed_at,
        deployedBy: data.deployed_by,
        status: data.status,
        environment: data.environment,
        buildNumber: data.build_number,
        commitHash: data.commit_hash,
        branch: data.branch,
        buildLogs: data.build_logs,
        deploymentLogs: data.deployment_logs,
        rollbackTo: data.rollback_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error getting latest version:', error);
      return null;
    }
  },

  // ===== GESTIÓN DE COMENTARIOS =====

  async getComments(versionId: string) {
    try {
      const { data, error } = await supabase
        .from('version_comments')
        .select('*')
        .eq('version_id', versionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  },

  async addComment(versionId: string, comment: string) {
    try {
      // Obtener el email del usuario actual
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || 'Usuario';

      const { data, error } = await supabase
        .from('version_comments')
        .insert({
          version_id: versionId,
          user_email: userEmail,
          comment: comment
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }
};
