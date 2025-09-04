import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, AuthenticatedRequest, PERMISSIONS } from './authMiddleware';
import { validateQueryParams, sanitizeForDatabase } from './validation';
import { sessionManager } from './sessionManager';

// =====================================================
// CONFIGURACIÓN DE PROTECCIÓN API
// =====================================================

export const API_CONFIG = {
  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutos
    MAX_REQUESTS: 100, // 100 requests por ventana
    SKIP_SUCCESSFUL_REQUESTS: false,
    SKIP_FAILED_REQUESTS: false
  },
  
  // Logging
  LOGGING: {
    ENABLED: true,
    LOG_SUCCESS: true,
    LOG_FAILURES: true,
    LOG_SLOW_REQUESTS: true,
    SLOW_REQUEST_THRESHOLD_MS: 1000 // 1 segundo
  },
  
  // Seguridad
  SECURITY: {
    ENABLE_CORS: true,
    ALLOWED_ORIGINS: ['http://localhost:3000', 'https://tuwebai.com'],
    ENABLE_CSRF_PROTECTION: true,
    ENABLE_XSS_PROTECTION: true,
    ENABLE_CONTENT_TYPE_VALIDATION: true
  }
};

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

export interface APIEndpointConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  requiredPermissions?: string[];
  requireAuth?: boolean;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  validation?: {
    body?: any;
    query?: any;
    params?: any;
  };
  timeout?: number;
}

export interface APIRequestContext {
  request: AuthenticatedRequest;
  startTime: number;
  endpoint: string;
  method: string;
  userId?: string;
  userRole?: string;
}

export interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  timestamp: string;
  requestId: string;
}

// =====================================================
// CLASE PRINCIPAL DE PROTECCIÓN API
// =====================================================

export class APIProtection {
  private static instance: APIProtection;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private requestLogs: Map<string, any[]> = new Map();

  private constructor() {}

  static getInstance(): APIProtection {
    if (!APIProtection.instance) {
      APIProtection.instance = new APIProtection();
    }
    return APIProtection.instance;
  }

  /**
   * Protege un endpoint API con todas las capas de seguridad
   */
  protectEndpoint(config: APIEndpointConfig) {
    return async (request: AuthenticatedRequest): Promise<NextResponse | null> => {
      const startTime = Date.now();
      const requestId = this.generateRequestId();
      
      const context: APIRequestContext = {
        request,
        startTime,
        endpoint: config.path,
        method: config.method,
        userId: request.user?.id,
        userRole: request.user?.role
      };

      try {
        // 1. Validar método HTTP
        if (request.method !== config.method) {
          return this.createErrorResponse(
            'Method Not Allowed',
            405,
            `Método ${request.method} no permitido para ${config.path}`,
            requestId
          );
        }

        // 2. Verificar CORS
        const corsResult = this.handleCORS(request);
        if (corsResult) return corsResult;

        // 3. Verificar autenticación si es requerida
        if (config.requireAuth !== false) {
          const authResult = await this.verifyAuthentication(request, config.requiredPermissions);
          if (authResult) return authResult;
        }

        // 4. Verificar rate limiting
        const rateLimitResult = await this.checkRateLimit(request, config.rateLimit);
        if (rateLimitResult) return rateLimitResult;

        // 5. Validar parámetros de consulta
        const queryValidationResult = this.validateQueryParameters(request);
        if (queryValidationResult) return queryValidationResult;

        // 6. Validar cuerpo de la solicitud si es necesario
        if (config.validation?.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          const bodyValidationResult = await this.validateRequestBody(request, config.validation.body);
          if (bodyValidationResult) return bodyValidationResult;
        }

        // 7. Verificar timeout
        if (config.timeout) {
          const timeoutResult = this.checkTimeout(startTime, config.timeout);
          if (timeoutResult) return timeoutResult;
        }

        // 8. Log de solicitud exitosa
        this.logRequest(context, 'SUCCESS', null, Date.now() - startTime);

        // 9. Incrementar contador de requests
        this.incrementRequestCount(request);

        return null; // La solicitud puede continuar

      } catch (error) {
        // Log de error
        this.logRequest(context, 'ERROR', error, Date.now() - startTime);
        
        return this.createErrorResponse(
          'Internal Server Error',
          500,
          'Error interno del servidor',
          requestId
        );
      }
    };
  }

  /**
   * Maneja CORS para la solicitud
   */
  private handleCORS(request: AuthenticatedRequest): NextResponse | null {
    if (!API_CONFIG.SECURITY.ENABLE_CORS) return null;

    const origin = request.headers.get('origin');
    
    if (origin && !API_CONFIG.SECURITY.ALLOWED_ORIGINS.includes(origin)) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'CORS Error',
          message: 'Origen no permitido'
        }), 
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'null',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }

    return null;
  }

  /**
   * Verifica la autenticación del usuario
   */
  private async verifyAuthentication(
    request: AuthenticatedRequest, 
    requiredPermissions?: string[]
  ): Promise<NextResponse | null> {
    try {
      // Usar el middleware de autenticación
      const authResult = await authMiddleware(requiredPermissions || [])(request);
      
      if (authResult) {
        return authResult;
      }

      // Verificar sesión activa
      const session = await sessionManager.checkCurrentSession();
      if (!session || session.status === 'expired') {
        return this.createErrorResponse(
          'Unauthorized',
          401,
          'Sesión expirada o inválida',
          this.generateRequestId()
        );
      }

      return null;
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      return this.createErrorResponse(
        'Unauthorized',
        401,
        'Error de autenticación',
        this.generateRequestId()
      );
    }
  }

  /**
   * Verifica rate limiting
   */
  private async checkRateLimit(
    request: AuthenticatedRequest, 
    customRateLimit?: { windowMs: number; maxRequests: number }
  ): Promise<NextResponse | null> {
    const rateLimit = customRateLimit || API_CONFIG.RATE_LIMIT;
    const identifier = this.getRateLimitIdentifier(request);
    
    const now = Date.now();
    const windowStart = now - rateLimit.windowMs;
    
    // Obtener contador actual
    const current = this.requestCounts.get(identifier) || { count: 0, resetTime: now + rateLimit.windowMs };
    
    // Resetear contador si la ventana ha expirado
    if (now > current.resetTime) {
      current.count = 0;
      current.resetTime = now + rateLimit.windowMs;
    }
    
    // Verificar límite
    if (current.count >= rateLimit.maxRequests) {
      return this.createErrorResponse(
        'Too Many Requests',
        429,
        `Rate limit excedido. Máximo ${rateLimit.maxRequests} requests por ${rateLimit.windowMs / 60000} minutos`,
        this.generateRequestId()
      );
    }
    
    // Incrementar contador
    current.count++;
    this.requestCounts.set(identifier, current);
    
    return null;
  }

  /**
   * Obtiene identificador para rate limiting
   */
  private getRateLimitIdentifier(request: AuthenticatedRequest): string {
    const userId = request.user?.id || 'anonymous';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    return `${userId}:${ip}`;
  }

  /**
   * Valida parámetros de consulta
   */
  private validateQueryParameters(request: AuthenticatedRequest): NextResponse | null {
    const url = new URL(request.url);
    const params: Record<string, any> = {};
    
    // Extraer parámetros de consulta
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Validar parámetros
    const validation = validateQueryParams(params);
    if (!validation.isValid) {
      return this.createErrorResponse(
        'Bad Request',
        400,
        `Parámetros de consulta inválidos: ${validation.errors.join(', ')}`,
        this.generateRequestId()
      );
    }
    
    return null;
  }

  /**
   * Valida el cuerpo de la solicitud
   */
  private async validateRequestBody(
    request: AuthenticatedRequest, 
    schema: any
  ): Promise<NextResponse | null> {
    try {
      const body = await request.json();
      
      // Sanitizar datos antes de validar
      const sanitizedBody = sanitizeForDatabase(body);
      
      // Validar con el esquema
      const validation = schema.safeParse(sanitizedBody);
      if (!validation.success) {
        const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        
        return this.createErrorResponse(
          'Bad Request',
          400,
          `Cuerpo de solicitud inválido: ${errors.join(', ')}`,
          this.generateRequestId()
        );
      }
      
      return null;
    } catch (error) {
      return this.createErrorResponse(
        'Bad Request',
        400,
        'Error parseando cuerpo de solicitud',
        this.generateRequestId()
      );
    }
  }

  /**
   * Verifica timeout de la solicitud
   */
  private checkTimeout(startTime: number, timeoutMs: number): NextResponse | null {
    const elapsed = Date.now() - startTime;
    
    if (elapsed > timeoutMs) {
      return this.createErrorResponse(
        'Request Timeout',
        408,
        `La solicitud excedió el tiempo límite de ${timeoutMs}ms`,
        this.generateRequestId()
      );
    }
    
    return null;
  }

  /**
   * Crea una respuesta de error estandarizada
   */
  private createErrorResponse(
    title: string, 
    status: number, 
    message: string, 
    requestId: string
  ): NextResponse {
    const response: APIResponse = {
      success: false,
      error: title,
      message,
      timestamp: new Date().toISOString(),
      requestId
    };

    return new NextResponse(
      JSON.stringify(response),
      { 
        status,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        }
      }
    );
  }

  /**
   * Genera un ID único para la solicitud
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Incrementa el contador de requests
   */
  private incrementRequestCount(request: AuthenticatedRequest): void {
    const identifier = this.getRateLimitIdentifier(request);
    const current = this.requestCounts.get(identifier) || { count: 0, resetTime: Date.now() + API_CONFIG.RATE_LIMIT.WINDOW_MS };
    current.count++;
    this.requestCounts.set(identifier, current);
  }

  /**
   * Registra la solicitud en el log
   */
  private logRequest(
    context: APIRequestContext, 
    status: 'SUCCESS' | 'ERROR', 
    error: any, 
    duration: number
  ): void {
    if (!API_CONFIG.LOGGING.ENABLED) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
      endpoint: context.endpoint,
      method: context.method,
      userId: context.userId,
      userRole: context.userRole,
      status,
      duration,
      error: error?.message || null,
      ip: context.request.headers.get('x-forwarded-for') || 
          context.request.headers.get('x-real-ip') || 
          'unknown',
      userAgent: context.request.headers.get('user-agent') || 'unknown'
    };

    // Agregar al log en memoria
    const endpointKey = `${context.method}:${context.endpoint}`;
    if (!this.requestLogs.has(endpointKey)) {
      this.requestLogs.set(endpointKey, []);
    }
    
    const logs = this.requestLogs.get(endpointKey)!;
    logs.push(logEntry);
    
    // Mantener solo los últimos 100 logs por endpoint
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }

    // Log a consola si está habilitado
    if (API_CONFIG.LOGGING.LOG_SUCCESS && status === 'SUCCESS') {

    }
    
    if (API_CONFIG.LOGGING.LOG_FAILURES && status === 'ERROR') {
      console.error(`❌ API ${context.method} ${context.endpoint} - Error: ${error?.message}`);
    }
    
    if (API_CONFIG.LOGGING.LOG_SLOW_REQUESTS && duration > API_CONFIG.LOGGING.SLOW_REQUEST_THRESHOLD_MS) {
      console.warn(`🐌 API ${context.method} ${context.endpoint} - Lenta: ${duration}ms`);
    }
  }

  /**
   * Obtiene estadísticas de requests
   */
  getRequestStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [endpoint, logs] of this.requestLogs.entries()) {
      const totalRequests = logs.length;
      const successfulRequests = logs.filter(log => log.status === 'SUCCESS').length;
      const failedRequests = logs.filter(log => log.status === 'ERROR').length;
      const slowRequests = logs.filter(log => log.duration > API_CONFIG.LOGGING.SLOW_REQUEST_THRESHOLD_MS).length;
      
      const avgDuration = logs.reduce((sum, log) => sum + log.duration, 0) / totalRequests;
      
      stats[endpoint] = {
        totalRequests,
        successfulRequests,
        failedRequests,
        slowRequests,
        avgDuration: Math.round(avgDuration),
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests * 100).toFixed(2) : 0
      };
    }
    
    return stats;
  }

  /**
   * Limpia logs antiguos
   */
  cleanupOldLogs(maxAgeHours: number = 24): void {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    for (const [endpoint, logs] of this.requestLogs.entries()) {
      const filteredLogs = logs.filter(log => new Date(log.timestamp).getTime() > cutoffTime);
      this.requestLogs.set(endpoint, filteredLogs);
    }
  }

  /**
   * Obtiene logs de un endpoint específico
   */
  getEndpointLogs(endpoint: string, method: string, limit: number = 50): any[] {
    const key = `${method}:${endpoint}`;
    const logs = this.requestLogs.get(key) || [];
    
    return logs.slice(-limit);
  }
}

// =====================================================
// FUNCIONES DE CONVENIENCIA
// =====================================================

/**
 * Protege un endpoint GET
 */
export function protectGET(
  path: string, 
  requiredPermissions?: string[], 
  options?: Partial<APIEndpointConfig>
) {
  return APIProtection.getInstance().protectEndpoint({
    method: 'GET',
    path,
    requiredPermissions,
    ...options
  });
}

/**
 * Protege un endpoint POST
 */
export function protectPOST(
  path: string, 
  requiredPermissions?: string[], 
  validation?: any,
  options?: Partial<APIEndpointConfig>
) {
  return APIProtection.getInstance().protectEndpoint({
    method: 'POST',
    path,
    requiredPermissions,
    validation: validation ? { body: validation } : undefined,
    ...options
  });
}

/**
 * Protege un endpoint PUT
 */
export function protectPUT(
  path: string, 
  requiredPermissions?: string[], 
  validation?: any,
  options?: Partial<APIEndpointConfig>
) {
  return APIProtection.getInstance().protectEndpoint({
    method: 'PUT',
    path,
    requiredPermissions,
    validation: validation ? { body: validation } : undefined,
    ...options
  });
}

/**
 * Protege un endpoint DELETE
 */
export function protectDELETE(
  path: string, 
  requiredPermissions?: string[], 
  options?: Partial<APIEndpointConfig>
) {
  return APIProtection.getInstance().protectEndpoint({
    method: 'DELETE',
    path,
    requiredPermissions,
    ...options
  });
}

/**
 * Protege un endpoint PATCH
 */
export function protectPATCH(
  path: string, 
  requiredPermissions?: string[], 
  validation?: any,
  options?: Partial<APIEndpointConfig>
) {
  return APIProtection.getInstance().protectEndpoint({
    method: 'PATCH',
    path,
    requiredPermissions,
    validation: validation ? { body: validation } : undefined,
    ...options
  });
}

// =====================================================
// MIDDLEWARE DE SEGURIDAD ADICIONAL
// =====================================================

/**
 * Middleware para validar Content-Type
 */
export function validateContentType(allowedTypes: string[] = ['application/json']) {
  return (request: AuthenticatedRequest): NextResponse | null => {
    if (!API_CONFIG.SECURITY.ENABLE_CONTENT_TYPE_VALIDATION) return null;
    
    const contentType = request.headers.get('content-type');
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return new NextResponse(
        JSON.stringify({
          error: 'Unsupported Media Type',
          message: `Content-Type no soportado. Permitidos: ${allowedTypes.join(', ')}`
        }),
        { status: 415 }
      );
    }
    
    return null;
  };
}

/**
 * Middleware para protección CSRF
 */
export function validateCSRFToken() {
  return (request: AuthenticatedRequest): NextResponse | null => {
    if (!API_CONFIG.SECURITY.ENABLE_CSRF_PROTECTION) return null;
    
    const csrfToken = request.headers.get('x-csrf-token');
    const sessionToken = request.cookies.get('session_token')?.value;
    
    if (!csrfToken || !sessionToken) {
      return new NextResponse(
        JSON.stringify({
          error: 'CSRF Token Missing',
          message: 'Token CSRF requerido'
        }),
        { status: 403 }
      );
    }
    
    // Aquí implementarías la validación real del token CSRF
    // Por ahora solo verificamos que exista
    
    return null;
  };
}

// =====================================================
// EXPORTACIONES PRINCIPALES
// =====================================================

export {
  APIProtection,
  API_CONFIG
};

export default APIProtection.getInstance();
