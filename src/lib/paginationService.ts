import { supabase } from './supabase';
import { handleSupabaseError } from './errorHandler';
import { projectCache, userCache, ticketCache, generateCacheKey, CACHE_TAGS } from './intelligentCache';

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class PaginationService {
  // Paginar proyectos
  async getProjects(params: PaginationParams): Promise<PaginatedResult<any>> {
    const cacheKey = generateCacheKey('projects', params.page, params.limit, JSON.stringify(params.filters || {}));
    
    return projectCache.withCache(
      cacheKey,
      async () => {
        const { page, limit, sortBy = 'created_at', sortOrder = 'desc', filters = {} } = params;
        const offset = (page - 1) * limit;

        let query = supabase
          .from('projects')
          .select('*', { count: 'exact' });

        // Aplicar filtros
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'string' && value.includes(',')) {
              // Filtro múltiple (ej: status: 'active,completed')
              const values = value.split(',');
              query = query.in(key, values);
            } else {
              query = query.eq(key, value);
            }
          }
        });

        // Aplicar ordenamiento
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // Aplicar paginación
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        const total = count || 0;
        const totalPages = Math.ceil(total / limit);

        return {
          data: data || [],
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        };
      },
      5 * 60 * 1000, // 5 minutos
      [CACHE_TAGS.PROJECTS]
    );
  }

  // Paginar usuarios
  async getUsers(params: PaginationParams): Promise<PaginatedResult<any>> {
    const cacheKey = generateCacheKey('users', params.page, params.limit, JSON.stringify(params.filters || {}));
    
    return userCache.withCache(
      cacheKey,
      async () => {
        const { page, limit, sortBy = 'created_at', sortOrder = 'desc', filters = {} } = params;
        const offset = (page - 1) * limit;

        let query = supabase
          .from('users')
          .select('*', { count: 'exact' });

        // Aplicar filtros
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value);
          }
        });

        // Aplicar ordenamiento
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // Aplicar paginación
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        const total = count || 0;
        const totalPages = Math.ceil(total / limit);

        return {
          data: data || [],
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        };
      },
      10 * 60 * 1000, // 10 minutos
      [CACHE_TAGS.USERS]
    );
  }

  // Paginar tickets
  async getTickets(params: PaginationParams): Promise<PaginatedResult<any>> {
    const cacheKey = generateCacheKey('tickets', params.page, params.limit, JSON.stringify(params.filters || {}));
    
    return ticketCache.withCache(
      cacheKey,
      async () => {
        const { page, limit, sortBy = 'created_at', sortOrder = 'desc', filters = {} } = params;
        const offset = (page - 1) * limit;

        let query = supabase
          .from('tickets')
          .select('*', { count: 'exact' });

        // Aplicar filtros
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'prioridad' && typeof value === 'string' && value.includes(',')) {
              const values = value.split(',');
              query = query.in(key, values);
            } else {
              query = query.eq(key, value);
            }
          }
        });

        // Aplicar ordenamiento
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // Aplicar paginación
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        const total = count || 0;
        const totalPages = Math.ceil(total / limit);

        return {
          data: data || [],
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        };
      },
      3 * 60 * 1000, // 3 minutos
      [CACHE_TAGS.TICKETS]
    );
  }

  // Paginar pagos
  async getPayments(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page, limit, sortBy = 'created_at', sortOrder = 'desc', filters = {} } = params;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });

    // Aplicar ordenamiento
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // Paginar notificaciones
  async getNotifications(params: PaginationParams, userId: string): Promise<PaginatedResult<any>> {
    const { page, limit, sortBy = 'created_at', sortOrder = 'desc', filters = {} } = params;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });

    // Aplicar ordenamiento
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // Invalidar caché después de operaciones CRUD
  invalidateCache(type: 'projects' | 'users' | 'tickets' | 'all'): void {
    switch (type) {
      case 'projects':
        projectCache.invalidateByTags([CACHE_TAGS.PROJECTS]);
        break;
      case 'users':
        userCache.invalidateByTags([CACHE_TAGS.USERS]);
        break;
      case 'tickets':
        ticketCache.invalidateByTags([CACHE_TAGS.TICKETS]);
        break;
      case 'all':
        projectCache.clear();
        userCache.clear();
        ticketCache.clear();
        break;
    }
  }
}

export const paginationService = new PaginationService();
