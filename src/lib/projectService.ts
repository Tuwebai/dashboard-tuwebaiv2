import { supabase } from './supabase';
import { Project, CreateProjectData, UpdateProjectData, ProjectFilters, ProjectSort, ProjectVersion, ChangeLog } from '@/types/project.types';
import { detectProjectType } from '../utils/projectTypeDetector';

// =====================================================
// SERVICIO DE PROYECTOS COMPLETAMENTE INTEGRADO CON SUPABASE
// =====================================================

export const projectService = {
  // =====================================================
  // OPERACIONES CRUD BÁSICAS
  // =====================================================

  /**
   * Obtener todos los proyectos con filtros, ordenamiento y paginación
   */
  async getProjects(filters?: ProjectFilters, sort?: ProjectSort, page = 1, limit = 10) {
    try {
      let query = supabase
        .from('projects')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.technology) {
        query = query.contains('technologies', [filters.technology]);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Aplicar ordenamiento
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Aplicar paginación
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        projects: data as Project[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw new Error(`Error al obtener proyectos: ${error.message}`);
    }
  },

  /**
   * Obtener un proyecto por ID
   */
  async getProjectById(id: string): Promise<Project> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (!data) {
        throw new Error('Proyecto no encontrado');
      }
      
      return data as Project;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw new Error(`Error al obtener el proyecto: ${error.message}`);
    }
  },

  /**
   * Crear un nuevo proyecto con sistema de aprobación
   */
  async createProject(projectData: CreateProjectData & { created_by?: string, user_role?: string }): Promise<Project> {
    try {
      // Validar datos antes de crear
      const validation = this.validateProjectData(projectData);
      if (!validation.isValid) {
        throw new Error(`Datos del proyecto inválidos: ${validation.errors.join(', ')}`);
      }

      // VALIDACIÓN CRÍTICA: Asegurar que created_by esté presente y sea válido
      if (!projectData.created_by || projectData.created_by.trim() === '') {
        throw new Error('El campo created_by es requerido y debe ser un ID de usuario válido');
      }



      // Obtener el rol del usuario desde la tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', projectData.created_by)
        .single();

      if (userError) {
        console.error('❌ Error obteniendo rol del usuario:', userError);
        throw new Error('No se pudo verificar el rol del usuario');
      }

      // Determinar el estado de aprobación basado en el rol del usuario
      const approvalStatus = userData.role === 'admin' ? 'approved' : 'pending';

      // Detectar automáticamente el tipo de proyecto
      const detectedType = detectProjectType({
        name: projectData.name,
        description: projectData.description,
        technologies: projectData.technologies
      });

      // Crear proyecto con estado de aprobación según el rol
      const projectToCreate = {
        name: projectData.name,
        description: projectData.description,
        technologies: projectData.technologies,
        status: projectData.status || 'development',
        is_active: true,
        created_by: projectData.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        approval_status: approvalStatus,
        type: detectedType.name, // Asignar tipo detectado automáticamente
        // Si es admin, marcar como aprobado por él mismo
        ...(userData.role === 'admin' && {
          approved_by: projectData.created_by,
          approved_at: new Date().toISOString()
        })
      };

      const { data: createdProject, error } = await supabase
        .from('projects')
        .insert([projectToCreate])
        .select()
        .single();

      if (error) {
        console.error('❌ Error de Supabase al crear proyecto:', error);
        
        // Manejar errores específicos de Supabase
        if (error.code === '23505') {
          throw new Error('Ya existe un proyecto con ese nombre');
        } else if (error.code === '23503') {
          throw new Error('Usuario no válido para crear el proyecto');
        } else if (error.code === '42501') {
          throw new Error('No tienes permisos para crear proyectos');
        } else {
          throw new Error(`Error de base de datos: ${error.message}`);
        }
      }
      

      return createdProject as Project;
    } catch (error) {
      console.error('❌ Error creating project:', error);
      
      // Si ya es un Error personalizado, re-lanzarlo
      if (error instanceof Error && !error.message.includes('Error al crear el proyecto')) {
        throw error;
      }
      
      // Crear un error más descriptivo
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al crear el proyecto: ${errorMessage}`);
    }
  },

  /**
   * Actualizar un proyecto existente
   */
  async updateProject(id: string, projectData: UpdateProjectData): Promise<Project> {
    try {
      // Verificar que el proyecto existe
      const existingProject = await this.getProjectById(id);
      
      // Agregar timestamp de actualización
      const updateData = {
        ...projectData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return data as Project;
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error(`Error al actualizar el proyecto: ${error.message}`);
    }
  },



  // =====================================================
  // OPERACIONES AVANZADAS
  // =====================================================

  /**
   * Obtener proyectos por usuario
   */
  async getProjectsByUser(userId: string): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data as Project[];
    } catch (error) {
      console.error('Error fetching user projects:', error);
      throw new Error(`Error al obtener proyectos del usuario: ${error.message}`);
    }
  },

  /**
   * Obtener proyectos por estado
   */
  async getProjectsByStatus(status: Project['status']): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', status)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data as Project[];
    } catch (error) {
      console.error('Error fetching projects by status:', error);
      throw new Error(`Error al obtener proyectos por estado: ${error.message}`);
    }
  },

  /**
   * Buscar proyectos por texto
   */
  async searchProjects(searchTerm: string): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data as Project[];
    } catch (error) {
      console.error('Error searching projects:', error);
      throw new Error(`Error al buscar proyectos: ${error.message}`);
    }
  },

  /**
   * Obtener proyectos por tecnologías
   */
  async getProjectsByTechnologies(technologies: string[]): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .overlaps('technologies', technologies)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data as Project[];
    } catch (error) {
      console.error('Error fetching projects by technologies:', error);
      throw new Error(`Error al obtener proyectos por tecnologías: ${error.message}`);
    }
  },

  // =====================================================
  // ELIMINACIÓN DE PROYECTOS
  // =====================================================

  /**
   * Eliminar un proyecto
   * - Admin: puede eliminar cualquier proyecto
   * - Cliente: solo puede eliminar sus propios proyectos rechazados
   */
  async deleteProject(projectId: string, userId: string, userRole?: string): Promise<void> {
    try {
      // Obtener información del proyecto y del usuario
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('created_by, approval_status')
        .eq('id', projectId)
        .single();

      if (fetchError) {
        console.error('❌ Error obteniendo proyecto:', fetchError);
        throw new Error('No se pudo encontrar el proyecto');
      }

      // Obtener el rol del usuario si no se proporciona
      let role = userRole;
      if (!role) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('❌ Error obteniendo rol del usuario:', userError);
          throw new Error('No se pudo verificar el rol del usuario');
        }
        role = userData.role;
      }

      // Verificar permisos
      if (role === 'admin') {
        // Admin puede eliminar cualquier proyecto
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId);

        if (error) {
          console.error('❌ Error eliminando proyecto (admin):', error);
          throw new Error('Error al eliminar el proyecto');
        }
      } else {
        // Cliente solo puede eliminar sus propios proyectos rechazados
        if (project.created_by !== userId) {
          throw new Error('No tienes permisos para eliminar este proyecto');
        }

        if (project.approval_status !== 'rejected') {
          throw new Error('Solo puedes eliminar proyectos que han sido rechazados');
        }

        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId)
          .eq('created_by', userId);

        if (error) {
          console.error('❌ Error eliminando proyecto (cliente):', error);
          throw new Error('Error al eliminar el proyecto');
        }
      }
    } catch (error) {
      console.error('❌ Error en deleteProject:', error);
      throw error;
    }
  },

  // =====================================================
  // ESTADÍSTICAS Y ANÁLISIS
  // =====================================================

  /**
   * Obtener estadísticas generales de proyectos
   */
  async getProjectStats() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('status, is_active, created_at');

      if (error) throw error;

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthISO = lastMonth.toISOString();

      const stats = {
        total: data.length,
        active: data.filter(p => p.is_active).length,
        inactive: data.filter(p => !p.is_active).length,
        development: data.filter(p => p.status === 'development').length,
        production: data.filter(p => p.status === 'production').length,
        paused: data.filter(p => p.status === 'paused').length,
        maintenance: data.filter(p => p.status === 'maintenance').length,
        createdThisMonth: data.filter(p => new Date(p.created_at) >= lastMonth).length,
        statusDistribution: {
          development: (data.filter(p => p.status === 'development').length / data.length) * 100,
          production: (data.filter(p => p.status === 'production').length / data.length) * 100,
          paused: (data.filter(p => p.status === 'paused').length / data.length) * 100,
          maintenance: (data.filter(p => p.status === 'maintenance').length / data.length) * 100
        }
      };

      return stats;
    } catch (error) {
      console.error('Error fetching project stats:', error);
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  },

  /**
   * Obtener tecnologías únicas con conteo
   */
  async getUniqueTechnologies(): Promise<Array<{ technology: string; count: number }>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('technologies')
        .eq('is_active', true);

      if (error) throw error;

      const technologyCount: Record<string, number> = {};
      
      data.forEach(project => {
        if (project.technologies) {
          project.technologies.forEach(tech => {
            technologyCount[tech] = (technologyCount[tech] || 0) + 1;
          });
        }
      });

      return Object.entries(technologyCount)
        .map(([technology, count]) => ({ technology, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error fetching technologies:', error);
      throw new Error(`Error al obtener tecnologías: ${error.message}`);
    }
  },

  /**
   * Obtener tendencias de proyectos por mes
   */
  async getProjectTrends(months: number = 12) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('created_at, status')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth() - months, 1).toISOString());

      if (error) throw error;

      const trends: Record<string, { total: number; byStatus: Record<string, number> }> = {};
      
      data.forEach(project => {
        const month = new Date(project.created_at).toISOString().slice(0, 7); // YYYY-MM
        
        if (!trends[month]) {
          trends[month] = { total: 0, byStatus: {} };
        }
        
        trends[month].total++;
        trends[month].byStatus[project.status] = (trends[month].byStatus[project.status] || 0) + 1;
      });

      return trends;
    } catch (error) {
      console.error('Error fetching project trends:', error);
      throw new Error(`Error al obtener tendencias: ${error.message}`);
    }
  },

  // =====================================================
  // VALIDACIONES Y UTILIDADES
  // =====================================================

  /**
   * Validar URL de GitHub
   */
  validateGitHubUrl(url: string): boolean {
    if (!url) return true; // URL opcional
    const githubRegex = /^https:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-._]+$/;
    return githubRegex.test(url);
  },

  /**
   * Validar datos del proyecto
   */
  validateProjectData(data: CreateProjectData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('El nombre del proyecto es requerido');
    }

    if (data.name && data.name.length > 255) {
      errors.push('El nombre del proyecto no puede exceder 255 caracteres');
    }

    if (data.description && data.description.length > 10000) {
      errors.push('La descripción no puede exceder 10,000 caracteres');
    }

    if (data.technologies && data.technologies.length > 20) {
      errors.push('No se pueden agregar más de 20 tecnologías');
    }

    if (data.github_repository_url && !this.validateGitHubUrl(data.github_repository_url)) {
      errors.push('La URL de GitHub no es válida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Verificar si un proyecto existe
   */
  async projectExists(id: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('id', id)
        .single();

      if (error) return false;
      return !!data;
    } catch (error) {
      return false;
    }
  },

  /**
   * Obtener proyectos similares basados en tecnologías
   */
  async getSimilarProjects(projectId: string, limit: number = 5): Promise<Project[]> {
    try {
      const project = await this.getProjectById(projectId);
      
      if (!project.technologies || project.technologies.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .neq('id', projectId)
        .overlaps('technologies', project.technologies)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data as Project[];
    } catch (error) {
      console.error('Error fetching similar projects:', error);
      return [];
    }
  },

  // =====================================================
  // FUNCIONES DE APROBACIÓN DE PROYECTOS
  // =====================================================

  /**
   * Obtener solicitudes de aprobación pendientes (solo para admins)
   */
  async getApprovalRequests() {
    try {
      const { data, error } = await supabase
        .from('approval_requests_with_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      throw new Error(`Error al obtener solicitudes de aprobación: ${error.message}`);
    }
  },

  /**
   * Aprobar un proyecto (solo para admins)
   */
  async approveProject(projectId: string, adminNotes?: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('approve_project', {
        p_project_id: projectId,
        p_admin_notes: adminNotes || null
      });

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error approving project:', error);
      throw new Error(`Error al aprobar el proyecto: ${error.message}`);
    }
  },

  /**
   * Rechazar un proyecto (solo para admins)
   */
  async rejectProject(projectId: string, adminNotes?: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('reject_project', {
        p_project_id: projectId,
        p_admin_notes: adminNotes || null
      });

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error rejecting project:', error);
      throw new Error(`Error al rechazar el proyecto: ${error.message}`);
    }
  },

  /**
   * Crear una solicitud de aprobación manual (para proyectos rechazados)
   */
  async createApprovalRequest(projectId: string, requestNotes?: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_project_approval_request', {
        p_project_id: projectId,
        p_request_notes: requestNotes || null
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating approval request:', error);
      throw new Error(`Error al crear solicitud de aprobación: ${error.message}`);
    }
  }
};
