import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { userService } from '@/lib/supabaseService';
import { projectService } from '@/lib/projectService';
import { toast as toastGlobal } from '@/hooks/use-toast';
import { SupabaseError } from '@/components/SupabaseError';
import { userPreferencesService } from '@/lib/userPreferencesService';

export interface Project {
  id: string;
  name: string;
  description?: string;
  technologies: string[];
  environment_variables?: Record<string, any>;
  status: 'development' | 'production' | 'paused' | 'maintenance';
  github_repository_url?: string;
  customicon?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_active: boolean;
  // Campos extendidos para compatibilidad
  type?: 'Web' | 'App' | 'Landing' | 'Ecommerce' | string;
  funcionalidades?: string[];
  fases?: Array<{
    key: string;
    estado: 'Pendiente' | 'En Progreso' | 'Terminado';
    descripcion?: string;
    fechaEntrega?: string;
    archivos?: Array<{ url: string; name: string }>;
    comentarios?: Array<{
      id: string;
      texto: string;
      autor: string;
      fecha: string;
      tipo: 'admin' | 'cliente';
    }>;
  }>;
  progressHistory?: Array<{ date: string; progress: number }>;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  // Avatar del usuario
  avatar?: string;
  // Perfil extendido
  phone?: string;
  company?: string;
  position?: string;
  bio?: string;
  location?: string;
  website?: string;
  // Configuración general
  language?: string;
  timezone?: string;
  date_format?: string;
  time_format?: string;
  // Privacidad
  profile_visibility?: string;
  show_email?: boolean;
  show_phone?: boolean;
  allow_analytics?: boolean;
  allow_cookies?: boolean;
  two_factor_auth?: boolean;
  // Notificaciones
  push_notifications?: boolean;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  sound_enabled?: boolean;
  vibration_enabled?: boolean;
  quiet_hours?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  project_updates?: boolean;
  payment_reminders?: boolean;
  support_updates?: boolean;
  marketing_emails?: boolean;
  // Rendimiento
  auto_save?: boolean;
  auto_save_interval?: number;
  cache_enabled?: boolean;
  image_quality?: string;
  animations_enabled?: boolean;
  low_bandwidth_mode?: boolean;
  // Seguridad
  session_timeout?: number;
  max_login_attempts?: number;
  require_password_change?: boolean;
  password_expiry_days?: number;
  login_notifications?: boolean;
  device_management?: boolean;
  // Timestamps
  last_login?: string;
}

export interface ProjectLog {
  id: string;
  projectId: string;
  action: string;
  user: string;
  timestamp: string;
}

export interface AppContextType {
  user: User | null;
  projects: Project[];
  isAuthenticated: boolean;
  logs: ProjectLog[];
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGithub: () => Promise<boolean>;
  logout: () => Promise<void>;
  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'ownerEmail'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addFunctionalities: (projectId: string, functionalities: string[]) => Promise<void>;
  addCommentToPhase: (projectId: string, faseKey: string, comment: {
    texto: string;
    autor: string;
    tipo: 'admin' | 'cliente';
  }) => Promise<void>;
  addLog: (log: Omit<ProjectLog, 'id' | 'timestamp'>) => Promise<void>;
  getProjectLogs: (projectId: string) => ProjectLog[];
  refreshData: () => Promise<void>;
  clearError: () => void;
  updateUserSettings: (updates: Partial<User>) => Promise<boolean>;
  getUserProjects: () => Project[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Cache para optimizar consultas
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any, ttl: number = 5 * 60 * 1000) => {
  cache.set(key, { data, timestamp: Date.now(), ttl });
};

const clearCache = () => {
  cache.clear();
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar el hook de autenticación de Supabase
  const { 
    user: supabaseUser, 
    session, 
    loading: authLoading, 
    error: authError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithGithub,
    signOut,
    clearError: clearAuthError
  } = useSupabaseAuth();

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setError(null);
    clearAuthError();
  }, [clearAuthError]);

  // Función para refrescar datos
  const refreshData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      clearCache();
      
      // Recargar proyectos según el rol del usuario
      let projectData: any[] = [];
      
      if (user.role === 'admin') {
        // Los administradores ven todos los proyectos
        const response = await projectService.getProjects();
        projectData = response?.projects || [];
      } else {
        // Los usuarios normales solo ven sus propios proyectos
        projectData = await projectService.getProjectsByUser(user.id);
      }
      
      setProjects(projectData as any);
      
      // Recargar logs (implementar cuando tengas la tabla de logs)
      // const logData = await logService.getUserLogs(user.id);
      // setLogs(logData);
      
    } catch (error) {
      // Error refreshing data
      setError('Error al recargar los datos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Obtener solo los proyectos del usuario actual (para conteos y estadísticas)
  const getUserProjects = useCallback(() => {
    if (!user) return [];
    
    if (user.role === 'admin') {
      // Los administradores ven todos los proyectos
      return projects;
    } else {
      // Los usuarios normales solo ven sus propios proyectos
      return projects.filter(p => p.created_by === user.id);
    }
  }, [user, projects]);

  // Sincronizar usuario de Supabase
  const syncUser = useCallback(async () => {
    if (authLoading) return;
    
    if (supabaseUser && session) {
      try {
        setLoading(true);
        
        // Obtener datos del usuario desde Supabase
        const cacheKey = `user_${supabaseUser.id}`;
        let userData = getCachedData(cacheKey);
        
        if (!userData) {
          try {
            userData = await userService.getUserById(supabaseUser.id);
          } catch (error) {
            // Error loading user data
            // Si no existe el usuario en la tabla, crearlo
            const { email, user_metadata } = supabaseUser;
            let role: 'admin' | 'user' = 'user';
            if (email && email.toLowerCase() === 'tuwebai@gmail.com') role = 'admin';
            
            // Obtener avatar del user_metadata
            const avatar = user_metadata?.avatar_url || 
                         user_metadata?.picture || 
                         user_metadata?.photoURL ||
                         user_metadata?.image;
            
            // Crear objeto de datos del usuario
            const userData: User = {
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              full_name: user_metadata?.full_name || user_metadata?.name || email?.split('@')[0] || '',
              role,
              avatar_url: avatar, // Usar avatar_url directamente
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            await userService.upsertUser(userData);
          }
          
          // Guardar en cache por 10 minutos
          setCachedData(cacheKey, userData, 10 * 60 * 1000);
        }
        
        // IMPORTANTE: Sincronizar avatar desde la base de datos
        if (userData && supabaseUser.email) {
          try {
            // Obtener datos actualizados del usuario (incluyendo avatar_url)
            const updatedUserData = await userService.getUserById(supabaseUser.id);
            
            if (updatedUserData) {
              // Mapear avatar_url a avatar para compatibilidad
              if (updatedUserData.avatar_url) {
                userData.avatar = updatedUserData.avatar_url;
              }
              
              // Si no hay avatar en DB, sincronizarlo
              if (!updatedUserData.avatar_url && supabaseUser.email) {
                const { realAvatarService } = await import('@/lib/avatarProviders');
                await realAvatarService.syncUserAvatar(supabaseUser.email);
                
                // Recargar datos del usuario con avatar
                const finalUserData = await userService.getUserById(supabaseUser.id);
                if (finalUserData) {
                  userData = finalUserData;
                  // Mapear avatar_url a avatar
                  if (finalUserData.avatar_url) {
                    userData.avatar = finalUserData.avatar_url;
                  }
                  setCachedData(cacheKey, userData, 10 * 60 * 1000);
                }
              }
            }
          } catch (error) {
            // Error sincronizando avatar
          }
        }
        
        setUser(userData as User);
        setIsAuthenticated(true);
        setError(null);

        // Migrar localStorage a base de datos
        if (userData && userData.id) {
          await userPreferencesService.migrateLocalStorageToDB(userData.id);
        }
        
        // Mostrar toast de bienvenida cuando se complete la autenticación
        // Solo si no es la carga inicial
        if (userData && userData.id) {
          const welcomeBack = await userPreferencesService.getUserPreferences(userData.id, 'welcome_back');
          if (welcomeBack.length === 0) {
            toastGlobal({
              title: '¡Bienvenido!',
              description: 'Has iniciado sesión correctamente.'
            });
            await userPreferencesService.saveUserPreference(userData.id, 'welcome_back', 'tuwebai_welcome_back', 'true');
          }
        }
        
      } catch (error) {
        setError('Error de autenticación');
      } finally {
        setLoading(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
      setProjects([]);
      setLogs([]);
      clearCache();
      // Limpiar preferencias de bienvenida
      if (user && user.id) {
        await userPreferencesService.deleteUserPreference(user.id, 'welcome_back', 'tuwebai_welcome_back');
      }
      setLoading(false);
    }
  }, [supabaseUser, session, authLoading]);

  useEffect(() => {
    syncUser();
  }, [syncUser]);

  // Suscripción en tiempo real para cambios en el usuario actual
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        async (payload) => {
          const updatedUserData = payload.new as any;
          
          // Actualizar el usuario en el contexto si hay cambios en avatar_url
          if (updatedUserData.avatar_url && updatedUserData.avatar_url !== user.avatar_url) {
            setUser(prev => prev ? {
              ...prev,
              avatar_url: updatedUserData.avatar_url,
              avatar: updatedUserData.avatar_url, // Para compatibilidad
              updated_at: updatedUserData.updated_at
            } : prev);
            
            // Actualizar cache
            const cacheKey = `user_${user.id}`;
            const cachedUser = getCachedData(cacheKey);
            if (cachedUser) {
              setCachedData(cacheKey, {
                ...cachedUser,
                avatar_url: updatedUserData.avatar_url,
                avatar: updatedUserData.avatar_url,
                updated_at: updatedUserData.updated_at
              }, 10 * 60 * 1000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Persistir estado de autenticación en localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem('tuwebai_auth', JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        timestamp: Date.now()
      }));
    } else {
      localStorage.removeItem('tuwebai_auth');
    }
  }, [isAuthenticated, user]);

  // Cargar proyectos desde Supabase
  const setupListeners = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLogs([]);
      return;
    }
    
    try {
      setLoading(true);
      
      // Cargar proyectos según el rol del usuario
      let projectData: any[] = [];
      
      if (user.role === 'admin') {
        // Los administradores ven todos los proyectos
        const response = await projectService.getProjects();
        projectData = response?.projects || [];
      } else {
        // Los usuarios normales solo ven sus propios proyectos
        projectData = await projectService.getProjectsByUser(user.id);
      }
      
      setProjects(projectData as any);
      
      // Cache de proyectos
      setCachedData(`projects_${user.email}`, projectData, 2 * 60 * 1000);
      
      // Por ahora no usamos suscripciones en tiempo real para evitar errores
      // TODO: Implementar suscripciones cuando sea necesario
      
    } catch (error) {
      setError('Error de conexión');
      setProjects([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setupListeners();
    }
    
    return () => {
      // Cleanup si es necesario en el futuro
      // if (subscription) {
      //   subscription.unsubscribe();
      // }
    };
  }, [user?.id, setupListeners]);

  // Login optimizado con manejo de errores mejorado
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signInWithEmail(email, password);
      
      // Solo mostrar toast de bienvenida si el login fue exitoso
      if (result) {
        toastGlobal({
          title: '¡Bienvenido!',
          description: 'Has iniciado sesión correctamente.'
        });
      }
      
      return result;
    } catch (error: any) {
      setError('Error al iniciar sesión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register optimizado
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await signUpWithEmail(email, password, { full_name: name });
      return true;
    } catch (error: any) {
      setError('Error al registrar usuario');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login con Google
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signInWithGoogle();
      
      // Para OAuth, no mostrar toast aquí ya que se redirige
      // El toast se mostrará en el callback de autenticación
      
      return result;
    } catch (error: any) {
      setError('Error al iniciar sesión con Google');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login con GitHub
  const loginWithGithub = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signInWithGithub();
      
      // Para OAuth, no mostrar toast aquí ya que se redirige
      // El toast se mostrará en el callback de autenticación
      
      return result;
    } catch (error: any) {
      setError('Error al iniciar sesión con GitHub');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout optimizado
  const logout = async () => {
    try {
      setLoading(true);
      await signOut();
      clearCache();
      // Limpiar preferencias de bienvenida
      if (user) {
        await userPreferencesService.deleteUserPreference(user.id, 'welcome_back', 'tuwebai_welcome_back');
      }
    } catch (error) {
      setError('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Crear proyecto optimizado
  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'ownerEmail'>) => {
    if (!user) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // VALIDACIÓN CRÍTICA: Asegurar que el usuario tenga ID válido
      if (!user.id || user.id.trim() === '') {
        throw new Error('ID de usuario inválido. No se puede crear el proyecto.');
      }
      
      // Creando proyecto para usuario
      
      const newProject = {
        ...projectData,
        created_by: user.id, // SIEMPRE usar el ID del usuario autenticado
        status: 'development' as const,
        technologies: projectData.technologies || []
      };
      
      // Crear el proyecto en la base de datos
      const createdProject = await projectService.createProject(newProject);
      
      // Actualizar el estado local inmediatamente
      if (createdProject) {
        setProjects(prevProjects => [...prevProjects, createdProject]);
      }
      
      // Limpiar cache de proyectos
      cache.delete(`projects_${user.email}`);
      
    } catch (error) {
      setError('Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar proyecto optimizado
  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener el proyecto actual para comparar progreso
      const currentProject = await projectService.getProjectById(id);
      let progressHistory = (currentProject as any).progressHistory || [];
      let prevProgress = 0;
      
      // Calcular progreso anterior
      if ((currentProject as any).fases && (currentProject as any).fases.length > 0) {
        const completed = (currentProject as any).fases.filter((f: any) => f.estado === 'Terminado').length;
        prevProgress = Math.round((completed / (currentProject as any).fases.length) * 100);
      }
      
      // Calcular nuevo progreso si fases cambian
      let newProgress = prevProgress;
      if ((updates as any).fases && (updates as any).fases.length > 0) {
        const completed = (updates as any).fases.filter((f: any) => f.estado === 'Terminado').length;
        newProgress = Math.round((completed / (updates as any).fases.length) * 100);
      }
      
      // Si el progreso cambió, agrega snapshot diario
      const today = new Date().toISOString().slice(0, 10);
      if (newProgress !== prevProgress) {
        // Si ya hay snapshot de hoy, reemplaza, si no, agrega
        const idx = progressHistory.findIndex((h: any) => h.date === today);
        if (idx >= 0) {
          progressHistory[idx] = { date: today, progress: newProgress };
        } else {
          progressHistory.push({ date: today, progress: newProgress });
        }
      }
      
             await projectService.updateProject(id, {
         ...updates,
         progressHistory
       } as any);
      
      if (user) {
        cache.delete(`projects_${user.email}`);
      }
    } catch (error) {
      setError('Error al actualizar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar proyecto optimizado
  const deleteProject = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) {
        throw new Error('ID de usuario inválido. No se puede eliminar el proyecto.');
      }
      
      await projectService.deleteProject(id, user.id, user.role);
      
      // Actualizar el estado local inmediatamente
      setProjects(prevProjects => prevProjects.filter(p => p.id !== id));
      
      // Limpiar cache de proyectos
      if (user) {
        cache.delete(`projects_${user.email}`);
      }
      
    } catch (error) {
      setError('Error al eliminar el proyecto');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Agregar funcionalidades optimizado
  const addFunctionalities = async (projectId: string, functionalities: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentProject = await projectService.getProjectById(projectId);
      const currentFuncionalidades = (currentProject as any).funcionalidades || [];
      const updatedFuncionalidades = [...currentFuncionalidades, ...functionalities];
      
             await projectService.updateProject(projectId, {
         funcionalidades: updatedFuncionalidades
       } as any);
      
      // Limpiar cache de proyectos
      if (user) {
        cache.delete(`projects_${user.email}`);
      }
      
    } catch (error) {
      setError('Error al agregar funcionalidades');
    } finally {
      setLoading(false);
    }
  };

  // Agregar comentario a fase optimizado
  const addCommentToPhase = async (projectId: string, faseKey: string, comment: {
    texto: string;
    autor: string;
    tipo: 'admin' | 'cliente';
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentProject = await projectService.getProjectById(projectId);
      const fases = (currentProject as any).fases || [];
      
      const updatedFases = fases.map((fase: any) => {
        if (fase.key === faseKey) {
          const comentarios = fase.comentarios || [];
          const newComment = {
            id: Date.now().toString(),
            ...comment,
            fecha: new Date().toISOString()
          };
          return {
            ...fase,
            comentarios: [...comentarios, newComment]
          };
        }
        return fase;
      });
      
             await projectService.updateProject(projectId, {
         fases: updatedFases
       } as any);
      
      // Limpiar cache de proyectos
      if (user) {
        cache.delete(`projects_${user.email}`);
      }
      
    } catch (error) {
      setError('Error al agregar comentario');
    } finally {
      setLoading(false);
    }
  };

  // Agregar log optimizado
  const addLog = async (log: Omit<ProjectLog, 'id' | 'timestamp'>) => {
    try {
      // Implementar cuando tengas la tabla de logs en Supabase
              // Log functionality to be implemented with Supabase logs table
      
      // Limpiar cache de logs
      if (user) {
        cache.delete(`logs_${user.email}`);
      }
      
    } catch (error) {
      // No mostrar error para logs ya que no es crítico
    }
  };

  // Obtener logs de proyecto optimizado con cache
  const getProjectLogs = useCallback((projectId: string) => {
    const cacheKey = `project_logs_${projectId}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const projectLogs = logs.filter(l => l.projectId === projectId);
    setCachedData(cacheKey, projectLogs, 5 * 60 * 1000); // 5 minutos
    
    return projectLogs;
  }, [logs]);

  // Actualizar configuración del usuario y sincronizar contexto
  const updateUserSettings = async (updates: Partial<User>) => {
    if (!user) return false;
    setLoading(true);
    try {
      await userService.updateUser(user.id, { ...updates, updated_at: new Date().toISOString() });
      setUser(prev => (prev ? { ...prev, ...updates } : prev));
      setCachedData(`user_${user.id}`, { ...user, ...updates }, 10 * 60 * 1000);
      return true;
    } catch (error) {
      setError('Error al actualizar configuración');
      return false;
    } finally {
      setLoading(false);
    }
  };

    // Memoizar el contexto para evitar re-renders innecesarios
  const contextValue = useMemo(() => ({
      user,
      projects,
      isAuthenticated,
      logs,
      loading,
      error,
      login,
      register,
      loginWithGoogle,
      loginWithGithub,
      logout,
      createProject,
      updateProject,
      deleteProject,
      addFunctionalities,
      addCommentToPhase,
      addLog,
      getProjectLogs,
      refreshData,
      clearError,
      updateUserSettings,
      getUserProjects
  }), [
    user,
    projects,
    isAuthenticated,
    logs,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    loginWithGithub,
      logout,
      createProject,
      updateProject,
      deleteProject,
      addFunctionalities,
      addCommentToPhase,
      addLog,
      getProjectLogs,
      refreshData,
      clearError,
      updateUserSettings,
      getUserProjects
  ]);



  // Mostrar error de configuración si hay un error crítico
  if (error && (error.includes('Invalid API key') || error.includes('Clave API de Supabase inválida') || error.includes('Error de configuración'))) {
    return (
      <SupabaseError 
        error={error} 
        onRetry={() => {
          clearError();
          window.location.reload();
        }}
      />
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    // Retornar un contexto por defecto en lugar de lanzar error
    return {
      user: null,
      projects: [],
      isAuthenticated: false,
      logs: [],
      loading: true,
      error: 'Contexto no disponible',
      login: async () => false,
      register: async () => false,
      loginWithGoogle: async () => false,
      loginWithGithub: async () => false,
      logout: async () => {},
      createProject: async () => {},
      updateProject: async () => {},
      deleteProject: async () => {},
      addFunctionalities: async () => {},
      addCommentToPhase: async () => {},
      addLog: async () => {},
      getProjectLogs: () => [],
      refreshData: async () => {},
      clearError: () => {},
      updateUserSettings: async () => false,
      getUserProjects: () => []
    };
  }
  return context;
}
