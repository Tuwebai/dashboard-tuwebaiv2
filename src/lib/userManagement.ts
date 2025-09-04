
import { supabase } from './supabase';
import { handleSupabaseError, handleNetworkError } from './errorHandler';
import { toast } from '@/hooks/use-toast';

// Tipos de usuario basados en la estructura real de la base de datos
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
}

export interface UserRole {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  can_delete: boolean;
  can_edit: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  role_id: string | null;
  invited_by: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled' | 'declined';
  token: string;
  expires_at: string;
  message: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  // Campos adicionales que podrían existir
  phone?: string;
  department?: string;
  position?: string;
  bio?: string;
  skills?: string[];
  status?: 'active' | 'inactive' | 'suspended';
  last_login?: string;
  login_count?: number;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface UserPermission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  action: string;
}

// Permisos del sistema
const SYSTEM_PERMISSIONS: UserPermission[] = [
  { id: 'users.view', name: 'users.view', display_name: 'Ver Usuarios', description: 'Puede ver la lista de usuarios', category: 'users', action: 'view' },
  { id: 'users.create', name: 'users.create', display_name: 'Crear Usuarios', description: 'Puede crear nuevos usuarios', category: 'users', action: 'create' },
  { id: 'users.edit', name: 'users.edit', display_name: 'Editar Usuarios', description: 'Puede editar usuarios existentes', category: 'users', action: 'edit' },
  { id: 'users.delete', name: 'users.delete', display_name: 'Eliminar Usuarios', description: 'Puede eliminar usuarios', category: 'users', action: 'delete' },
  { id: 'roles.view', name: 'roles.view', display_name: 'Ver Roles', description: 'Puede ver roles del sistema', category: 'roles', action: 'view' },
  { id: 'roles.create', name: 'roles.create', display_name: 'Crear Roles', description: 'Puede crear nuevos roles', category: 'roles', action: 'create' },
  { id: 'roles.edit', name: 'roles.edit', display_name: 'Editar Roles', description: 'Puede editar roles existentes', category: 'roles', action: 'edit' },
  { id: 'roles.delete', name: 'roles.delete', display_name: 'Eliminar Roles', description: 'Puede eliminar roles', category: 'roles', action: 'delete' },
  { id: 'projects.view', name: 'projects.view', display_name: 'Ver Proyectos', description: 'Puede ver todos los proyectos', category: 'projects', action: 'view' },
  { id: 'projects.manage', name: 'projects.manage', display_name: 'Gestionar Proyectos', description: 'Puede gestionar proyectos', category: 'projects', action: 'manage' },
  { id: 'tickets.view', name: 'tickets.view', display_name: 'Ver Tickets', description: 'Puede ver tickets del sistema', category: 'tickets', action: 'view' },
  { id: 'tickets.manage', name: 'tickets.manage', display_name: 'Gestionar Tickets', description: 'Puede gestionar tickets', category: 'tickets', action: 'manage' },
  { id: 'payments.view', name: 'payments.view', display_name: 'Ver Pagos', description: 'Puede ver información de pagos', category: 'payments', action: 'view' },
  { id: 'payments.manage', name: 'payments.manage', display_name: 'Gestionar Pagos', description: 'Puede gestionar pagos', category: 'payments', action: 'manage' },
  { id: 'system.admin', name: 'system.admin', display_name: 'Administrador del Sistema', description: 'Acceso completo al sistema', category: 'system', action: 'admin' }
];

export class UserManagementService {
  private permissions: UserPermission[] = SYSTEM_PERMISSIONS;

  // Obtener todos los usuarios
  public async getUsers(filters?: any, sort?: any, page: number = 1, limit: number = 50): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    try {

      
      // Obtener usuarios de Supabase con la estructura real de la tabla
      const { data: allUsers, error: countError } = await supabase
        .from('users')
        .select('id, email, full_name, role, avatar_url, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (countError) {

        throw new Error(`Error de Supabase: ${countError.message}`);
      }



      if (!allUsers || allUsers.length === 0) {

        return { users: [], total: 0, page: 1, totalPages: 0 };
      }

      // Aplicar filtros
      let filteredUsers = allUsers;
      
      if (filters?.role && filters.role !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === filters.role);
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.email.toLowerCase().includes(searchLower) ||
          (user.full_name && user.full_name.toLowerCase().includes(searchLower))
        );
      }

      // Aplicar ordenamiento
      if (sort?.field && sort?.direction) {
        filteredUsers.sort((a, b) => {
          const aValue = a[sort.field as keyof typeof a];
          const bValue = b[sort.field as keyof typeof b];
          
          if (sort.direction === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      } else {
        filteredUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      // Aplicar paginación
      const total = filteredUsers.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);



        return {
        users: paginatedUsers,
        total,
        page,
        totalPages
      };

    } catch (error) {

      throw error;
    }
  }

  // Obtener un usuario por ID
  public async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Crear un nuevo usuario
  public async createUser(userData: Partial<User>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          email: userData.email!,
          full_name: userData.full_name || null,
          role: userData.role || 'user',
          avatar_url: userData.avatar_url || null
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado correctamente.",
      });

      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el usuario.",
        variant: "destructive",
      });
      throw error;
    }
  }

  // Actualizar un usuario
  public async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado correctamente.",
      });

      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario.",
        variant: "destructive",
      });
      throw error;
    }
  }

  // Eliminar un usuario
  public async deleteUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario.",
        variant: "destructive",
      });
      return false;
    }
  }

  // Obtener roles del sistema
  public async getRoles(): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting roles:', error);
      return [];
    }
  }

  // Crear un nuevo rol
  public async createRole(roleData: Partial<UserRole>): Promise<UserRole> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .insert([{
          name: roleData.name!,
          display_name: roleData.display_name!,
          description: roleData.description || null,
          permissions: roleData.permissions || [],
          is_system: false,
          can_delete: true,
          can_edit: true
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Rol creado",
        description: "El rol ha sido creado correctamente.",
      });

      return data;
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el rol.",
        variant: "destructive",
      });
      throw error;
    }
  }

  // Actualizar un rol
  public async updateRole(roleId: string, roleData: Partial<UserRole>): Promise<UserRole> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .update({
          name: roleData.name,
          display_name: roleData.display_name,
          description: roleData.description,
          permissions: roleData.permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Rol actualizado",
        description: "El rol ha sido actualizado correctamente.",
      });

      return data;
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol.",
        variant: "destructive",
      });
      throw error;
    }
  }

  // Eliminar un rol
  public async deleteRole(roleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      
      toast({
        title: "Rol eliminado",
        description: "El rol ha sido eliminado correctamente.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el rol.",
        variant: "destructive",
      });
      return false;
    }
  }

  // Obtener invitaciones
  public async getInvitations(): Promise<UserInvitation[]> {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting invitations:', error);
      handleSupabaseError(error, 'Obtener invitaciones');
      return [];
    }
  }

  // Crear una invitación
  public async createInvitation(invitationData: Partial<UserInvitation>): Promise<UserInvitation> {
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar que el usuario tiene permisos de administrador
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('No se pudo verificar el rol del usuario');
      }

      if (userData.role !== 'admin') {
        throw new Error('Solo los administradores pueden crear invitaciones');
      }

      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días

      const { data, error } = await supabase
        .from('user_invitations')
        .insert([{
          email: invitationData.email!,
          role_id: invitationData.role_id || null,
          invited_by: user.id, // Usar el ID del usuario actual
          status: 'pending',
          token: token,
          expires_at: expiresAt.toISOString(),
          message: invitationData.message || null
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Invitación enviada",
        description: "La invitación ha sido enviada correctamente.",
      });

      return data;
    } catch (error) {
      console.error('Error creating invitation:', error);
      handleSupabaseError(error, 'Crear invitación');
      throw error;
    }
  }

  // Obtener logs de auditoría
  public async getAuditLogs(userId?: string, limit: number = 100): Promise<AuditLog[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  // Crear log de auditoría
  public async createAuditLog(logData: Partial<AuditLog>): Promise<AuditLog> {
    try {
              const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: logData.user_id!,
          action: logData.action!,
          details: logData.details || {},
          ip_address: logData.ip_address || null,
          user_agent: logData.user_agent || null
        }])
          .select()
          .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  // Obtener estadísticas de usuarios
  public async getUserStats(): Promise<{
    total: number;
    admins: number;
    users: number;
    active: number;
    inactive: number;
  }> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, role, created_at');

      if (error) throw error;

      const total = users?.length || 0;
      const admins = users?.filter(u => u.role === 'admin').length || 0;
      const regularUsers = users?.filter(u => u.role === 'user').length || 0;
      
      // Considerar usuarios activos si se crearon en los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const active = users?.filter(u => new Date(u.created_at) > thirtyDaysAgo).length || 0;
      const inactive = total - active;

      return {
        total,
        admins,
        users: regularUsers,
        active,
        inactive
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        total: 0,
        admins: 0,
        users: 0,
        active: 0,
        inactive: 0
      };
    }
  }

  // Verificar permisos de un usuario
  public async checkUserPermissions(userId: string, permission: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;

      // Los administradores tienen todos los permisos
      if (user.role === 'admin') return true;

      // Para usuarios regulares, verificar permisos específicos
      const userRole = await this.getUserRole(userId);
      if (!userRole) return false;

      return userRole.permissions.includes(permission);
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return false;
    }
  }

  // Obtener el rol de un usuario
  private async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      // Por ahora, asumimos que los usuarios regulares tienen permisos básicos
      // En el futuro, esto se puede expandir para usar la tabla user_roles
      return {
        id: 'basic-user',
        name: 'basic-user',
        display_name: 'Usuario Básico',
        description: 'Usuario con permisos básicos',
        permissions: ['projects.view', 'tickets.view'],
        is_system: true,
        can_delete: false,
        can_edit: false,
        created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Generar token para invitaciones
  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Obtener permisos del sistema
  public getSystemPermissions(): UserPermission[] {
    return this.permissions;
  }

  // Obtener permisos por categoría
  public getPermissionsByCategory(category: string): UserPermission[] {
    return this.permissions.filter(p => p.category === category);
  }
}

// Instancia singleton del servicio
export const userManagementService = new UserManagementService();
