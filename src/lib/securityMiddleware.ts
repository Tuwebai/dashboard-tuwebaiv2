import { supabase } from './supabase';
import { handleSupabaseError } from './errorHandler';

export interface SecurityConfig {
  rateLimit: {
    windowMs: number; // Ventana de tiempo en ms
    maxRequests: number; // Máximo de requests por ventana
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
  session: {
    maxAge: number; // Duración máxima de sesión en ms
    refreshThreshold: number; // Tiempo antes de expirar para refrescar
    requireReauth: boolean; // Requerir reautenticación periódica
  };
  csrf: {
    enabled: boolean;
    tokenLength: number;
    headerName: string;
  };
  headers: {
    enableSecurityHeaders: boolean;
    enableCORS: boolean;
    allowedOrigins: string[];
  };
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

export interface SecurityEvent {
  type: 'rate_limit' | 'suspicious_activity' | 'auth_failure' | 'csrf_violation';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: Date;
}

export class SecurityMiddleware {
  private config: SecurityConfig;
  private rateLimitStore = new Map<string, RateLimitEntry>();
  private securityEvents: SecurityEvent[] = [];
  private csrfTokens = new Map<string, { token: string; expires: number }>();

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      },
      session: {
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        refreshThreshold: 2 * 60 * 60 * 1000, // 2 horas
        requireReauth: false
      },
      csrf: {
        enabled: true,
        tokenLength: 32,
        headerName: 'X-CSRF-Token'
      },
      headers: {
        enableSecurityHeaders: true,
        enableCORS: true,
        allowedOrigins: ['http://localhost:3000', 'https://tuwebai.com']
      },
      ...config
    };

    this.startCleanup();
  }

  // Rate Limiting
  async checkRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const entry = this.rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Crear nueva entrada o resetear
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.config.rateLimit.windowMs,
        blocked: false
      };
      this.rateLimitStore.set(identifier, newEntry);

      return {
        allowed: true,
        remaining: this.config.rateLimit.maxRequests - 1,
        resetTime: newEntry.resetTime
      };
    }

    if (entry.blocked) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    entry.count++;

    if (entry.count > this.config.rateLimit.maxRequests) {
      entry.blocked = true;
      
      // Registrar evento de seguridad
      this.logSecurityEvent({
        type: 'rate_limit',
        details: {
          identifier,
          count: entry.count,
          maxRequests: this.config.rateLimit.maxRequests
        },
        timestamp: new Date()
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    return {
      allowed: true,
      remaining: this.config.rateLimit.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  // Verificar autenticación
  async verifyAuthentication(): Promise<{ valid: boolean; user?: any; needsRefresh?: boolean }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return { valid: false };
      }

      const now = Date.now();
      const sessionAge = now - new Date(session.expires_at!).getTime();
      const needsRefresh = sessionAge > (this.config.session.maxAge - this.config.session.refreshThreshold);

      // Verificar si la sesión ha expirado
      if (sessionAge > this.config.session.maxAge) {
        await supabase.auth.signOut();
        return { valid: false };
      }

      // Obtener información del usuario
      const { data: user, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user.user) {
        return { valid: false };
      }

      return {
        valid: true,
        user: user.user,
        needsRefresh
      };
    } catch (error) {
      handleSupabaseError(error, 'Verificar autenticación');
      return { valid: false };
    }
  }

  // Generar token CSRF
  generateCSRFToken(userId: string): string {
    const token = this.generateRandomToken(this.config.csrf.tokenLength);
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 horas

    this.csrfTokens.set(userId, { token, expires });
    return token;
  }

  // Verificar token CSRF
  verifyCSRFToken(userId: string, token: string): boolean {
    if (!this.config.csrf.enabled) {
      return true;
    }

    const entry = this.csrfTokens.get(userId);
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expires) {
      this.csrfTokens.delete(userId);
      return false;
    }

    return entry.token === token;
  }

  // Verificar permisos de usuario
  async verifyUserPermissions(userId: string, requiredRole?: string, requiredPermissions?: string[]): Promise<boolean> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('role, permissions')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return false;
      }

      // Verificar rol
      if (requiredRole && user.role !== requiredRole) {
        return false;
      }

      // Verificar permisos específicos
      if (requiredPermissions && requiredPermissions.length > 0) {
        const userPermissions = user.permissions || [];
        const hasAllPermissions = requiredPermissions.every(permission => 
          userPermissions.includes(permission)
        );
        
        if (!hasAllPermissions) {
          return false;
        }
      }

      return true;
    } catch (error) {
      handleSupabaseError(error, 'Verificar permisos de usuario');
      return false;
    }
  }

  // Detectar actividad sospechosa
  detectSuspiciousActivity(userId: string, activity: Record<string, any>): boolean {
    const recentEvents = this.securityEvents.filter(event => 
      event.userId === userId && 
      (Date.now() - event.timestamp.getTime()) < (5 * 60 * 1000) // Últimos 5 minutos
    );

    // Detectar múltiples intentos de login fallidos
    const failedLogins = recentEvents.filter(event => event.type === 'auth_failure');
    if (failedLogins.length >= 5) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        userId,
        details: {
          reason: 'multiple_failed_logins',
          count: failedLogins.length,
          activity
        },
        timestamp: new Date()
      });
      return true;
    }

    // Detectar patrones de rate limiting
    const rateLimitEvents = recentEvents.filter(event => event.type === 'rate_limit');
    if (rateLimitEvents.length >= 3) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        userId,
        details: {
          reason: 'frequent_rate_limiting',
          count: rateLimitEvents.length,
          activity
        },
        timestamp: new Date()
      });
      return true;
    }

    return false;
  }

  // Bloquear usuario temporalmente
  async blockUser(userId: string, reason: string, duration: number = 15 * 60 * 1000): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_blocks')
        .insert([{
          user_id: userId,
          reason,
          blocked_until: new Date(Date.now() + duration).toISOString(),
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      this.logSecurityEvent({
        type: 'suspicious_activity',
        userId,
        details: {
          reason: 'user_blocked',
          blockReason: reason,
          duration
        },
        timestamp: new Date()
      });
    } catch (error) {
      handleSupabaseError(error, 'Bloquear usuario');
    }
  }

  // Verificar si el usuario está bloqueado
  async isUserBlocked(userId: string): Promise<{ blocked: boolean; reason?: string; until?: Date }> {
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('*')
        .eq('user_id', userId)
        .gt('blocked_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        return {
          blocked: true,
          reason: data.reason,
          until: new Date(data.blocked_until)
        };
      }

      return { blocked: false };
    } catch (error) {
      handleSupabaseError(error, 'Verificar bloqueo de usuario');
      return { blocked: false };
    }
  }

  // Obtener headers de seguridad
  getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.headers.enableSecurityHeaders) {
      headers['X-Content-Type-Options'] = 'nosniff';
      headers['X-Frame-Options'] = 'DENY';
      headers['X-XSS-Protection'] = '1; mode=block';
      headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
      headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()';
    }

    if (this.config.headers.enableCORS) {
      headers['Access-Control-Allow-Origin'] = this.config.headers.allowedOrigins.join(', ');
      headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRF-Token';
    }

    return headers;
  }

  // Middleware principal
  async processRequest(
    request: Request,
    options: {
      requireAuth?: boolean;
      requiredRole?: string;
      requiredPermissions?: string[];
      skipRateLimit?: boolean;
    } = {}
  ): Promise<{
    allowed: boolean;
    user?: any;
    error?: string;
    headers?: Record<string, string>;
  }> {
    const { requireAuth = true, requiredRole, requiredPermissions, skipRateLimit = false } = options;

    // Verificar rate limiting
    if (!skipRateLimit) {
      const clientIP = this.getClientIP(request);
      const rateLimitResult = await this.checkRateLimit(clientIP);
      
      if (!rateLimitResult.allowed) {
        return {
          allowed: false,
          error: 'Rate limit exceeded',
          headers: this.getSecurityHeaders()
        };
      }
    }

    // Verificar autenticación
    if (requireAuth) {
      const authResult = await this.verifyAuthentication();
      
      if (!authResult.valid) {
        this.logSecurityEvent({
          type: 'auth_failure',
          details: {
            reason: 'invalid_session',
            userAgent: request.headers.get('User-Agent') || '',
            ip: this.getClientIP(request)
          },
          timestamp: new Date()
        });

        return {
          allowed: false,
          error: 'Authentication required',
          headers: this.getSecurityHeaders()
        };
      }

      // Verificar si el usuario está bloqueado
      const blockResult = await this.isUserBlocked(authResult.user.id);
      if (blockResult.blocked) {
        return {
          allowed: false,
          error: `User blocked: ${blockResult.reason}`,
          headers: this.getSecurityHeaders()
        };
      }

      // Verificar permisos
      if (requiredRole || requiredPermissions) {
        const hasPermissions = await this.verifyUserPermissions(
          authResult.user.id,
          requiredRole,
          requiredPermissions
        );

        if (!hasPermissions) {
          return {
            allowed: false,
            error: 'Insufficient permissions',
            headers: this.getSecurityHeaders()
          };
        }
      }

      // Verificar token CSRF para requests no-GET
      if (request.method !== 'GET' && this.config.csrf.enabled) {
        const csrfToken = request.headers.get(this.config.csrf.headerName);
        if (!csrfToken || !this.verifyCSRFToken(authResult.user.id, csrfToken)) {
          this.logSecurityEvent({
            type: 'csrf_violation',
            userId: authResult.user.id,
            details: {
              token: csrfToken,
              userAgent: request.headers.get('User-Agent') || '',
              ip: this.getClientIP(request)
            },
            timestamp: new Date()
          });

          return {
            allowed: false,
            error: 'Invalid CSRF token',
            headers: this.getSecurityHeaders()
          };
        }
      }

      return {
        allowed: true,
        user: authResult.user,
        headers: this.getSecurityHeaders()
      };
    }

    return {
      allowed: true,
      headers: this.getSecurityHeaders()
    };
  }

  // Obtener IP del cliente
  private getClientIP(request: Request): string {
    const forwarded = request.headers.get('X-Forwarded-For');
    const realIP = request.headers.get('X-Real-IP');
    const clientIP = request.headers.get('CF-Connecting-IP'); // Cloudflare

    return forwarded?.split(',')[0] || realIP || clientIP || 'unknown';
  }

  // Generar token aleatorio
  private generateRandomToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Registrar evento de seguridad
  private logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // Mantener solo los últimos 1000 eventos
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Enviar a base de datos en background
    this.saveSecurityEvent(event).catch(error => {
      console.error('Error saving security event:', error);
    });
  }

  // Guardar evento de seguridad en la base de datos
  private async saveSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_events')
        .insert([{
          type: event.type,
          user_id: event.userId,
          ip: event.ip,
          user_agent: event.userAgent,
          details: event.details,
          created_at: event.timestamp.toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving security event to database:', error);
    }
  }

  // Limpiar datos expirados
  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Limpiar rate limit store
      for (const [key, entry] of this.rateLimitStore.entries()) {
        if (now > entry.resetTime) {
          this.rateLimitStore.delete(key);
        }
      }

      // Limpiar tokens CSRF expirados
      for (const [key, entry] of this.csrfTokens.entries()) {
        if (now > entry.expires) {
          this.csrfTokens.delete(key);
        }
      }

      // Limpiar eventos de seguridad antiguos
      this.securityEvents = this.securityEvents.filter(event => 
        (now - event.timestamp.getTime()) < (24 * 60 * 60 * 1000) // Últimas 24 horas
      );
    }, 5 * 60 * 1000); // Cada 5 minutos
  }

  // Obtener estadísticas de seguridad
  getSecurityStats(): {
    rateLimitEntries: number;
    csrfTokens: number;
    securityEvents: number;
    recentEvents: SecurityEvent[];
  } {
    const recentEvents = this.securityEvents.filter(event => 
      (Date.now() - event.timestamp.getTime()) < (60 * 60 * 1000) // Última hora
    );

    return {
      rateLimitEntries: this.rateLimitStore.size,
      csrfTokens: this.csrfTokens.size,
      securityEvents: this.securityEvents.length,
      recentEvents
    };
  }
}

export const securityMiddleware = new SecurityMiddleware();
