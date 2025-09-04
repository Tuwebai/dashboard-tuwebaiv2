import { supabase } from './supabase';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  stage: string;
  assigned_to?: string;
  client_id: string;
  client_email: string;
  category?: string;
  tags: string[];
  escalation_count: number;
  created_at: string;
  updated_at: string;
  last_activity: string;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  client_email: string;
  tags?: string[];
}

export interface UpdateTicketData {
  subject?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'new' | 'in_progress' | 'resolved' | 'closed';
  stage?: string;
  assigned_to?: string;
  category?: string;
  tags?: string[];
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  assigned_to?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export const ticketService = {
  // Obtener todos los tickets con filtros
  async getTickets(filters?: TicketFilters): Promise<Ticket[]> {
    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.priority) {
          query = query.eq('priority', filters.priority);
        }
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.assigned_to) {
          query = query.eq('assigned_to', filters.assigned_to);
        }
        if (filters.search) {
          query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
        if (filters.date_from) {
          query = query.gte('created_at', filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte('created_at', filters.date_to);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tickets:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTickets:', error);
      return [];
    }
  },

  // Obtener ticket por ID
  async getTicketById(id: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching ticket:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getTicketById:', error);
      return null;
    }
  },

  // Crear nuevo ticket
  async createTicket(ticketData: CreateTicketData, clientId: string): Promise<Ticket | null> {
    try {
      const newTicket = {
        ...ticketData,
        client_id: clientId,
        status: 'new',
        stage: 'new',
        escalation_count: 0,
        tags: ticketData.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tickets')
        .insert([newTicket])
        .select()
        .single();

      if (error) {
        console.error('Error creating ticket:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createTicket:', error);
      return null;
    }
  },

  // Actualizar ticket
  async updateTicket(id: string, updates: UpdateTicketData): Promise<Ticket | null> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating ticket:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateTicket:', error);
      return null;
    }
  },

  // Eliminar ticket
  async deleteTicket(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting ticket:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTicket:', error);
      return false;
    }
  },

  // Asignar ticket a usuario
  async assignTicket(ticketId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          assigned_to: userId,
          status: 'in_progress',
          stage: 'assigned',
          updated_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) {
        console.error('Error assigning ticket:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in assignTicket:', error);
      return false;
    }
  },

  // Cambiar estado del ticket
  async changeTicketStatus(ticketId: string, status: string, stage?: string): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      };

      if (stage) {
        updateData.stage = stage;
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) {
        console.error('Error changing ticket status:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in changeTicketStatus:', error);
      return false;
    }
  },

  // Escalar ticket
  async escalateTicket(ticketId: string): Promise<boolean> {
    try {
      const { data: ticket } = await supabase
        .from('tickets')
        .select('escalation_count')
        .eq('id', ticketId)
        .single();

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const { error } = await supabase
        .from('tickets')
        .update({
          escalation_count: (ticket.escalation_count || 0) + 1,
          status: 'in_progress',
          stage: 'escalated',
          updated_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) {
        console.error('Error escalating ticket:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in escalateTicket:', error);
      return false;
    }
  },

  // Obtener estadísticas de tickets
  async getTicketStats(): Promise<{
    total: number;
    new: number;
    in_progress: number;
    resolved: number;
    closed: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('status, priority');

      if (error) {
        console.error('Error fetching ticket stats:', error);
        throw error;
      }

      const stats = {
        total: data.length,
        new: data.filter(t => t.status === 'new').length,
        in_progress: data.filter(t => t.status === 'in_progress').length,
        resolved: data.filter(t => t.status === 'resolved').length,
        closed: data.filter(t => t.status === 'closed').length,
        critical: data.filter(t => t.priority === 'critical').length,
        high: data.filter(t => t.priority === 'high').length,
        medium: data.filter(t => t.priority === 'medium').length,
        low: data.filter(t => t.priority === 'low').length
      };

      return stats;
    } catch (error) {
      console.error('Error in getTicketStats:', error);
      return {
        total: 0,
        new: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };
    }
  },

  // Buscar tickets
  async searchTickets(query: string): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .or(`subject.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching tickets:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchTickets:', error);
      return [];
    }
  },

  // Obtener tickets por cliente
  async getTicketsByClient(clientId: string): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client tickets:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTicketsByClient:', error);
      return [];
    }
  },

  // Obtener tickets asignados a usuario
  async getTicketsByAssignee(userId: string): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assigned tickets:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTicketsByAssignee:', error);
      return [];
    }
  }
};
