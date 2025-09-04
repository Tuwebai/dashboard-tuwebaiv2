import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Configuración del cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Interfaz para el usuario autenticado
export interface UserPayload {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin: Date;
}

// Extender NextRequest para incluir el usuario
export interface AuthenticatedRequest extends NextRequest {
  user?: UserPayload;
}

// Roles y permisos del sistema
export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
  GUEST: 'guest'
} as const;

export const PERMISSIONS = {
  // Gestión de proyectos
  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  
  // Gestión de usuarios
  USER_MANAGE: 'user:manage',
  USER_INVITE: 'user:invite',
  USER_DELETE: 'user:delete',
  
  // Gestión de pagos
  PAYMENT_VIEW: 'payment:view',
  PAYMENT_MANAGE: 'payment:manage',
  
  // Configuración del sistema
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_LOGS: 'system:logs'
} as const;

// Mapeo de roles a permisos
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MODERATOR]: [
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.USER_INVITE,
    PERMISSIONS.PAYMENT_VIEW
  ],
  [ROLES.USER]: [
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PAYMENT_VIEW
  ],
  [ROLES.GUEST]: [
    PERMISSIONS.PROJECT_READ
  ]
};

/**
 * Middleware de autenticación y autorización
 * @param requiredPermissions Permisos requeridos para acceder al endpoint
 * @param options Opciones adicionales de configuración
 */
export const authMiddleware = (
  requiredPermissions: string[] = [],
  options: {
    requireAuth?: boolean;
    checkRateLimit?: boolean;
    logAccess?: boolean;
  } = {}
) => {
  const {
    requireAuth = true,
    checkRateLimit = true,
    logAccess = true
  } = options;

  return async (req: AuthenticatedRequest): Promise<NextResponse | null> => {
    try {
      // 1. Verificar autenticación si es requerida
      if (requireAuth) {
        const authResult = await verifyAuthentication(req);
        if (authResult instanceof NextResponse) {
          return authResult;
        }
        req.user = authResult;
      }

      // 2. Verificar permisos si se especifican
      if (requiredPermissions.length > 0 && req.user) {
        const hasPermission = await verifyPermissions(req.user, requiredPermissions);
        if (!hasPermission) {
          return new NextResponse(
            JSON.stringify({ 
              message: 'Forbidden: Insufficient permissions',
              required: requiredPermissions,
              userPermissions: req.user.permissions
            }), 
            { status: 403 }
          );
        }
      }

      // 3. Verificar rate limiting si está habilitado
      if (checkRateLimit && req.user) {
        const rateLimitResult = await checkRateLimit(req.user.id);
        if (rateLimitResult instanceof NextResponse) {
          return rateLimitResult;
        }
      }

      // 4. Log de acceso si está habilitado
      if (logAccess && req.user) {
        await logAccessAttempt(req.user, req.url, 'SUCCESS');
      }

      return null; // La solicitud puede continuar

    } catch (error) {
      console.error('Auth middleware error:', error);
      return new NextResponse(
        JSON.stringify({ message: 'Internal server error' }), 
        { status: 500 }
      );
    }
  };
};

/**
 * Verifica la autenticación del usuario
 */
async function verifyAuthentication(req: AuthenticatedRequest): Promise<UserPayload | NextResponse> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new NextResponse(
      JSON.stringify({ message: 'Authentication required' }), 
      { status: 401 }
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new NextResponse(
        JSON.stringify({ message: 'Invalid or expired token' }), 
        { status: 401 }
      );
    }

    // Verificar si el usuario está activo
    if (!user.email_confirmed_at) {
      return new NextResponse(
        JSON.stringify({ message: 'Email not confirmed' }), 
        { status: 401 }
      );
    }

    // Obtener rol y permisos del usuario
    const userRole = await getUserRole(user.id);
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    // Verificar si el usuario está bloqueado
    const isBlocked = await checkUserBlocked(user.id);
    if (isBlocked) {
      return new NextResponse(
        JSON.stringify({ message: 'Account blocked' }), 
        { status: 403 }
      );
    }

    // Actualizar último login
    await updateLastLogin(user.id);

    return {
      id: user.id,
      email: user.email!,
      role: userRole,
      permissions: userPermissions,
      isActive: true,
      lastLogin: new Date()
    };

  } catch (error) {
    console.error('Authentication verification error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Authentication failed' }), 
      { status: 500 }
    );
  }
}

/**
 * Verifica si el usuario tiene los permisos requeridos
 */
async function verifyPermissions(user: UserPayload, requiredPermissions: string[]): Promise<boolean> {
  // Los admins tienen todos los permisos
  if (user.role === ROLES.ADMIN) {
    return true;
  }

  // Verificar si el usuario tiene todos los permisos requeridos
  return requiredPermissions.every(permission => 
    user.permissions.includes(permission)
  );
}

/**
 * Obtiene el rol del usuario desde la base de datos
 */
async function getUserRole(userId: string): Promise<string> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return ROLES.USER; // Rol por defecto
    }

    return data.role || ROLES.USER;
  } catch (error) {
    console.error('Error getting user role:', error);
    return ROLES.USER;
  }
}

/**
 * Verifica si el usuario está bloqueado
 */
async function checkUserBlocked(userId: string): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('users')
      .select('is_blocked')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.is_blocked || false;
  } catch (error) {
    console.error('Error checking user blocked status:', error);
    return false;
  }
}

/**
 * Actualiza el último login del usuario
 */
async function updateLastLogin(userId: string): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

/**
 * Verifica rate limiting para el usuario
 */
async function checkRateLimit(userId: string): Promise<NextResponse | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const { data, error } = await supabase
      .from('api_requests')
      .select('count')
      .eq('user_id', userId)
      .gte('created_at', oneMinuteAgo.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Rate limit check error:', error);
      return null;
    }

    const currentCount = data?.count || 0;
    const maxRequests = 100; // Máximo 100 requests por minuto

    if (currentCount >= maxRequests) {
      return new NextResponse(
        JSON.stringify({ message: 'Rate limit exceeded' }), 
        { status: 429 }
      );
    }

    // Incrementar contador
    await supabase
      .from('api_requests')
      .upsert({
        user_id: userId,
        count: currentCount + 1,
        created_at: now.toISOString()
      });

    return null;
  } catch (error) {
    console.error('Rate limit error:', error);
    return null;
  }
}

/**
 * Registra intentos de acceso
 */
async function logAccessAttempt(
  user: UserPayload, 
  url: string, 
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED'
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    await supabase
      .from('access_logs')
      .insert({
        user_id: user.id,
        url,
        status,
        ip_address: '127.0.0.1', // En producción, obtener IP real
        user_agent: 'Unknown', // En producción, obtener User-Agent real
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging access attempt:', error);
  }
}

/**
 * Middleware para verificar sesión activa
 */
export const sessionMiddleware = async (req: AuthenticatedRequest): Promise<NextResponse | null> => {
  const sessionToken = req.cookies.get('session_token')?.value;
  
  if (!sessionToken) {
    return new NextResponse(
      JSON.stringify({ message: 'Session expired' }), 
      { status: 401 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return new NextResponse(
        JSON.stringify({ message: 'Invalid session' }), 
        { status: 401 }
      );
    }

    // Verificar si la sesión no ha expirado
    const sessionExpiry = new Date(session.expires_at! * 1000);
    if (sessionExpiry < new Date()) {
      return new NextResponse(
        JSON.stringify({ message: 'Session expired' }), 
        { status: 401 }
      );
    }

    return null;
  } catch (error) {
    console.error('Session middleware error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Session verification failed' }), 
      { status: 500 }
    );
  }
};
