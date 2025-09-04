// Tipos de usuario para el Dashboard TuWebAI

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  
  // Avatar del usuario - Estandarizado a avatar_url
  avatar_url?: string;
  
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
  dateFormat?: string;
  timeFormat?: string;
  
  // Privacidad
  profileVisibility?: string;
  showEmail?: boolean;
  showPhone?: boolean;
  allowAnalytics?: boolean;
  allowCookies?: boolean;
  twoFactorAuth?: boolean;
  
  // Notificaciones
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  quietHours?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  projectUpdates?: boolean;
  paymentReminders?: boolean;
  supportUpdates?: boolean;
  marketingEmails?: boolean;
  
  // Rendimiento
  autoSave?: boolean;
  autoSaveInterval?: number;
  cacheEnabled?: boolean;
  imageQuality?: string;
  animationsEnabled?: boolean;
  lowBandwidthMode?: boolean;
  
  // Seguridad
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  requirePasswordChange?: boolean;
  passwordExpiryDays?: number;
  loginNotifications?: boolean;
  deviceManagement?: boolean;
  
  // Timestamps
  lastLogin?: string;
  last_login?: string;
}

// Tipos para creación y actualización de usuarios
export interface CreateUserData {
  email: string;
  full_name?: string;
  role?: 'admin' | 'user';
  phone?: string;
  company?: string;
  position?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export interface UpdateUserData {
  full_name?: string;
  role?: 'admin' | 'user';
  phone?: string;
  company?: string;
  position?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar_url?: string;
  language?: string;
  timezone?: string;
}

// Tipos para autenticación
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
    photoURL?: string;
    image?: string;
  };
}

// Tipos para roles y permisos
export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  description?: string;
}

export interface UserPermission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

// Tipos para sesiones
export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    location?: string;
  };
  isActive: boolean;
}

// Tipos para auditoría
export interface UserAuditLog {
  id: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export default User;
