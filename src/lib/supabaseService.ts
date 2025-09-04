import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

// Tipos para la base de datos
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string; // Campo para la URL del avatar
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  phase?: string;
  budget?: number;
  deadline?: string;
  team_members?: string[];
}

export interface Ticket {
  id: string;
  // Campos en español (estructura real de la BD)
  asunto?: string;
  mensaje?: string;
  email?: string;
  fecha?: string;
  // Campos de respuesta del admin
  respuesta?: string;
  respondido_por?: string;
  fecha_respuesta?: string;
  estado?: string;
  // Campos de respuesta del cliente
  respuesta_cliente?: string;
  fecha_respuesta_cliente?: string;
  // Campos en inglés (para compatibilidad)
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  user_id?: string;
  assigned_to?: string | null;
  created_at?: string;
  updated_at?: string;
  project_id?: string;
  category?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  project_id?: string;
  invoice_id?: string;
}

export interface Comment {
  id: string;
  text: string;
  author_id: string;
  author_name: string;
  author_role: 'admin' | 'user';
  timestamp: string;
  project_id: string;
  phase_key?: string;
  parent_id?: string;
  replies?: Comment[];
  reactions?: {
    [key: string]: string[];
  };
  mentions?: string[];
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  is_edited: boolean;
  edited_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string;
  assigned_by: string;
  project_id: string;
  phase_key?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  attachments?: string[];
}

export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_at: string;
  project_id: string;
  phase_key?: string;
  version: number;
  description?: string;
  tags?: string[];
}

export interface ChatRoom {
  id: string;
  name: string;
  project_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants: string[];
  is_private: boolean;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
  message_type: 'text' | 'file' | 'system';
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

export interface EditorDocument {
  id: string;
  project_id: string;
  title: string;
  content: string;
  language: string;
  version: number;
  last_modified: string;
  last_modified_by: string;
  last_modified_by_name: string;
  collaborators: string[];
  is_public: boolean;
  tags: string[];
}

export interface UserPresence {
  id: string;
  user_id: string;
  user_name: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  current_project?: string;
  current_page?: string;
}

export interface SecurityLog {
  id: string;
  action: string;
  user: string;
  user_email: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'data' | 'system' | 'payment' | 'admin';
  details: any;
  location?: string;
  success: boolean;
}

// Servicios principales
export class SupabaseService {
  // Usuarios
  static async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      // Validar que el ID no esté vacío
      if (!id || id.trim() === '') {
        console.warn('getUserById: ID vacío o inválido:', id);
        return null;
      }

      // Intentar obtener el usuario con manejo de errores específicos
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at, updated_at, avatar_url')
        .eq('id', id)
        .maybeSingle(); // Usar maybeSingle en lugar de single para evitar errores

      if (error) {
        // Solo manejar errores de conexión, no loggear errores de red
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_CLOSED')) {
          return null;
        }
        console.error('Error en getUserById:', error);
        return null;
      }

      if (!data) {
        // Usuario no encontrado - manejo silencioso
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error inesperado en getUserById:', error);
      return null;
    }
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  // Proyectos
  static async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getProjectsByUserId(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getProjectById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Tickets
  static async getTickets(): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createTicket(ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>): Promise<Ticket> {
    const { data, error } = await supabase
      .from('tickets')
      .insert([ticket])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTicket(id: string, updates: Partial<Ticket>): Promise<void> {
    const { error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  // Comentarios
  static async getComments(projectId: string, phaseKey?: string): Promise<Comment[]> {
    let query = supabase
      .from('comments')
      .select('*')
      .eq('project_id', projectId)
      .is('parent_id', null)
      .order('timestamp', { ascending: false });

    if (phaseKey) {
      query = query.eq('phase_key', phaseKey);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createComment(comment: Omit<Comment, 'id'>): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert([comment])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateComment(id: string, updates: Partial<Comment>): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Tareas
  static async getTasks(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Archivos
  static async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createProjectFile(file: Omit<ProjectFile, 'id'>): Promise<ProjectFile> {
    const { data, error } = await supabase
      .from('project_files')
      .insert([file])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProjectFile(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_files')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Chat
  static async getChatRooms(projectId: string): Promise<ChatRoom[]> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createChatRoom(room: Omit<ChatRoom, 'id' | 'created_at' | 'updated_at'>): Promise<ChatRoom> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert([room])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getChatMessages(roomId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createChatMessage(message: Omit<ChatMessage, 'id'>): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([message])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Documentos del editor
  static async getEditorDocuments(projectId: string): Promise<EditorDocument[]> {
    const { data, error } = await supabase
      .from('editor_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('last_modified', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createEditorDocument(document: Omit<EditorDocument, 'id'>): Promise<EditorDocument> {
    const { data, error } = await supabase
      .from('editor_documents')
      .insert([document])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateEditorDocument(id: string, updates: Partial<EditorDocument>): Promise<void> {
    const { error } = await supabase
      .from('editor_documents')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  // Presencia de usuarios
  static async updateUserPresence(presence: Omit<UserPresence, 'id'>): Promise<void> {
    const { error } = await supabase
      .from('user_presence')
      .upsert([presence], { onConflict: 'user_id' });

    if (error) throw error;
  }

  static async getUserPresence(): Promise<UserPresence[]> {
    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .order('last_seen', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Logs de seguridad
  static async createSecurityLog(log: Omit<SecurityLog, 'id'>): Promise<void> {
    const { error } = await supabase
      .from('security_logs')
      .insert([log]);

    if (error) throw error;
  }

  static async getSecurityLogs(): Promise<SecurityLog[]> {
    const { data, error } = await supabase
      .from('security_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  }

  // Pagos
  static async getPayments(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createPayment(payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePayment(id: string, updates: Partial<Payment>): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  // Suscripciones en tiempo real
  static subscribeToTable(table: string, callback: (payload: any) => void) {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  }

  static subscribeToRow(table: string, id: string, callback: (payload: any) => void) {
    return supabase
      .channel(`public:${table}:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter: `id=eq.${id}` }, callback)
      .subscribe();
  }

  // Utilidades
  static getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  static handleError(error: any, context: string = 'Operación'): void {
    console.error(`Error en ${context}:`, error);
    toast({
      title: 'Error',
      description: `Error en ${context}: ${error.message}`,
      variant: 'destructive'
    });
  }
}

// Exportar instancia única
export const supabaseService = new SupabaseService();

// Servicios para compatibilidad con el código existente
export const userService = {
  async getUserById(id: string): Promise<User | null> {
    return SupabaseService.getUserById(id);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    return SupabaseService.updateUser(id, updates);
  },

  async upsertUser(userData: User): Promise<void> {
    try {
      // Intentar actualizar primero
      await SupabaseService.updateUser(userData.id, userData);
    } catch (error) {
      // Si no existe, crear nuevo directamente con Supabase
      const { id, ...createData } = userData;
      const { error: insertError } = await supabase
        .from('users')
        .insert([createData]);

      if (insertError) throw insertError;
    }
  },

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const ticketService = {
  async getTickets(): Promise<Ticket[]> {
    return SupabaseService.getTickets();
  },

  async createTicket(ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>): Promise<Ticket> {
    return SupabaseService.createTicket(ticket);
  },

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<void> {
    return SupabaseService.updateTicket(id, updates);
  },

  async deleteTicket(id: string): Promise<void> {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getTicketsByClient(clientId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTicketsByAssignee(userId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
