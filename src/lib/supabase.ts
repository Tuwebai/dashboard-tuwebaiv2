import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuración de Supabase usando variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar que las variables estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables de entorno de Supabase requeridas');
}

// Patrón Singleton para evitar múltiples instancias de GoTrueClient
let supabaseInstance: SupabaseClient | null = null;
let isInitializing = false;

// Storage personalizado compatible con Supabase
const createCustomStorage = () => {
  if (typeof window === 'undefined') {
    // Servidor - retornar storage mock
    return {
      getItem: (key: string) => Promise.resolve(null),
      setItem: (key: string, value: string) => Promise.resolve(),
      removeItem: (key: string) => Promise.resolve()
    };
  }

  // Cliente - usar localStorage con manejo de errores
  return {
    getItem: (key: string) => {
      try {
        const item = localStorage.getItem(key);
        return Promise.resolve(item);
      } catch (error) {
        console.warn('Error reading from localStorage:', error);
        return Promise.resolve(null);
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
        return Promise.resolve();
      } catch (error) {
        console.warn('Error writing to localStorage:', error);
        return Promise.resolve();
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
        return Promise.resolve();
      } catch (error) {
        console.warn('Error removing from localStorage:', error);
        return Promise.resolve();
      }
    }
  };
};

// Función para obtener o crear la instancia única de Supabase
const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance && !isInitializing) {
    isInitializing = true;
    
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          storage: createCustomStorage()
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        },
        global: {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey
          }
        },
        db: {
          schema: 'public'
        }
      });
      

    } catch (error) {
      console.error('❌ Error creando instancia de Supabase:', error);
      isInitializing = false;
      throw error;
    } finally {
      isInitializing = false;
    }
  }
  
  if (!supabaseInstance) {
    throw new Error('No se pudo crear la instancia de Supabase');
  }
  
  return supabaseInstance;
};

// Exportar la instancia única de Supabase
export const supabase = getSupabaseClient();

// Exportar tipos útiles
export type Database = {
  public: {
    Tables: {
                   users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: string;
          avatar_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          user_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          user_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          user_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          user_id: string;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: string;
          priority?: string;
          user_id: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          user_id?: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          status: string;
          payment_method: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency?: string;
          status?: string;
          payment_method: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          status?: string;
          payment_method?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      environment_variables: {
        Row: {
          id: string;
          key: string;
          value: string;
          is_sensitive: boolean;
          environment: string;
          project_id: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          is_sensitive?: boolean;
          environment?: string;
          project_id: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
          is_sensitive?: boolean;
          environment?: string;
          project_id?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
    };
  };
};

// Exportar tipos específicos
export type User = Database['public']['Tables']['users']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type EnvironmentVariable = Database['public']['Tables']['environment_variables']['Row'];
