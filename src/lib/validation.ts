import { z } from 'zod';
import DOMPurify from 'dompurify';

// =====================================================
// ESQUEMAS DE VALIDACIÓN PRINCIPALES
// =====================================================

// Esquema base para usuarios
const UserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email().min(5).max(255),
  name: z.string().min(2).max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
  role: z.enum(['admin', 'moderator', 'user', 'guest']).default('user'),
  is_active: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

// Esquema para proyectos
const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3).max(200).regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_\.]+$/),
  description: z.string().max(1000).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).default('draft'),
  budget: z.number().positive().optional(),
  deadline: z.date().optional(),
  created_by: z.string().uuid(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

// Esquema para pagos
const PaymentSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  amount: z.number().positive().max(999999.99),
  currency: z.enum(['USD', 'EUR', 'MXN']).default('USD'),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']).default('pending'),
  payment_method: z.enum(['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe']),
  transaction_id: z.string().max(255).optional(),
  created_at: z.date().optional()
});

// Esquema para archivos
const FileSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  size: z.number().positive().max(100 * 1024 * 1024), // 100MB max
  type: z.string().regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9\-\.]+$/),
  url: z.string().url().optional(),
  uploaded_by: z.string().uuid(),
  created_at: z.date().optional()
});

// =====================================================
// FUNCIONES DE SANITIZACIÓN
// =====================================================

/**
 * Sanitiza texto HTML para prevenir XSS
 */
export function sanitizeHTML(html: string): string {
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false
    });
  }
  
  // Fallback para servidor
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Sanitiza texto plano removiendo caracteres peligrosos
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Sanitiza URLs para prevenir ataques de redirección
 */
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Solo permitir protocolos seguros
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Protocolo no permitido');
    }
    
    // Verificar que no sea un URL de redirección malicioso
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /onclick/i,
      /onload/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        throw new Error('URL contiene patrones sospechosos');
      }
    }
    
    return parsed.toString();
  } catch (error) {
    console.error('Error sanitizing URL:', error);
    return '';
  }
}

/**
 * Sanitiza números para prevenir inyección
 */
export function sanitizeNumber(value: any): number | null {
  if (typeof value === 'number') {
    return isFinite(value) ? value : null;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isFinite(parsed) ? parsed : null;
  }
  
  return null;
}

/**
 * Sanitiza emails
 */
export function sanitizeEmail(email: string): string {
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '');
}

// =====================================================
// VALIDACIÓN DE ARCHIVOS
// =====================================================

// Tipos de archivo permitidos
export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  text: ['text/plain', 'text/csv']
};

// Tamaños máximos por tipo
export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  spreadsheet: 5 * 1024 * 1024, // 5MB
  text: 1 * 1024 * 1024 // 1MB
};

/**
 * Valida un archivo subido
 */
export function validateFile(file: File): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Verificar tipo de archivo
  const fileType = file.type;
  const isAllowedType = Object.values(ALLOWED_FILE_TYPES).flat().includes(fileType);
  
  if (!isAllowedType) {
    errors.push(`Tipo de archivo no permitido: ${fileType}`);
  }
  
  // Verificar tamaño
  const maxSize = getMaxFileSize(fileType);
  if (file.size > maxSize) {
    errors.push(`Archivo demasiado grande. Máximo: ${formatFileSize(maxSize)}`);
  }
  
  // Verificar nombre del archivo
  const fileName = file.name;
  if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_\.]+$/.test(fileName)) {
    errors.push('Nombre de archivo contiene caracteres no permitidos');
  }
  
  // Verificar extensión
  const extension = fileName.split('.').pop()?.toLowerCase();
  const allowedExtensions = getAllowedExtensions(fileType);
  if (extension && !allowedExtensions.includes(extension)) {
    errors.push(`Extensión no permitida: .${extension}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Obtiene el tamaño máximo permitido para un tipo de archivo
 */
function getMaxFileSize(fileType: string): number {
  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(fileType)) {
      return MAX_FILE_SIZES[category as keyof typeof MAX_FILE_SIZES];
    }
  }
  return 1 * 1024 * 1024; // 1MB por defecto
}

/**
 * Obtiene las extensiones permitidas para un tipo de archivo
 */
function getAllowedExtensions(fileType: string): string[] {
  const extensionMap: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    'application/vnd.ms-excel': ['xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
    'text/plain': ['txt'],
    'text/csv': ['csv']
  };
  
  return extensionMap[fileType] || [];
}

/**
 * Formatea el tamaño de archivo en bytes a formato legible
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =====================================================
// VALIDACIÓN DE SQL Y PREVENCIÓN DE INYECCIÓN
// =====================================================

/**
 * Valida que un string no contenga SQL malicioso
 */
export function validateSQLInput(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/|;)/,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\b\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/i
  ];
  
  return !sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Escapa caracteres especiales para consultas SQL seguras
 */
export function escapeSQLInput(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Valida parámetros de consulta para prevenir inyección
 */
export function validateQueryParams(params: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && !validateSQLInput(value)) {
      errors.push(`Parámetro '${key}' contiene SQL malicioso`);
    }
    
    if (typeof value === 'string' && value.length > 1000) {
      errors.push(`Parámetro '${key}' es demasiado largo`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// =====================================================
// VALIDACIÓN DE FORMULARIOS
// =====================================================

/**
 * Valida un formulario completo usando un esquema Zod
 */
export function validateForm<T>(schema: z.ZodSchema<T>, data: any): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Error de validación desconocido'] };
  }
}

/**
 * Valida campos individuales de un formulario
 */
export function validateField<T>(schema: z.ZodSchema<T>, value: any, fieldName: string): { isValid: boolean; error?: string } {
  try {
    schema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find(err => err.path.includes(fieldName));
      return { 
        isValid: false, 
        error: fieldError ? fieldError.message : `Campo ${fieldName} inválido` 
      };
    }
    return { isValid: false, error: `Error validando ${fieldName}` };
  }
}

// =====================================================
// SANITIZACIÓN DE OBJETOS COMPLETOS
// =====================================================

/**
 * Sanitiza un objeto completo recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj } as T;
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      (sanitized as any)[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      (sanitized as any)[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      (sanitized as any)[key] = value.map((item: any) => 
        typeof item === 'string' ? sanitizeText(item) : item
      );
    }
  }
  
  return sanitized;
}

/**
 * Sanitiza datos antes de enviarlos a la base de datos
 */
export function sanitizeForDatabase<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data } as T;
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      // Sanitizar texto pero mantener algunos caracteres especiales para la BD
      (sanitized as any)[key] = value
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
  }
  
  return sanitized;
}

// =====================================================
// EXPORTACIONES PRINCIPALES
// =====================================================

export {
  UserSchema,
  ProjectSchema,
  PaymentSchema,
  FileSchema
};

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeURL,
  sanitizeNumber,
  sanitizeEmail,
  validateFile,
  validateSQLInput,
  escapeSQLInput,
  validateQueryParams,
  validateForm,
  validateField,
  sanitizeObject,
  sanitizeForDatabase
};
