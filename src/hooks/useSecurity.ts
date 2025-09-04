import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface SecurityStats {
  totalLogins: number;
  failedLoginsToday: number;
  lastLogin: string | null;
  suspiciousActivity: number;
}

interface LoginAttempt {
  email: string;
  ip_address: string;
  success: boolean;
  user_agent: string;
  created_at: string;
}

export function useSecurity() {
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [has2FA, setHas2FA] = useState(false);
  const [isSecureConnection, setIsSecureConnection] = useState(true);

  // Verificar conexión segura
  useEffect(() => {
    setIsSecureConnection(window.location.protocol === 'https:');
  }, []);

  // Obtener estadísticas de seguridad
  const getSecurityStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_security_stats');

      if (error) throw error;

      setSecurityStats({
        totalLogins: data?.total_logins || 0,
        failedLoginsToday: data?.failed_logins_today || 0,
        lastLogin: data?.last_login || null,
        suspiciousActivity: data?.suspicious_activity || 0
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas de seguridad:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Registrar acceso
  const logAccess = useCallback(async (
    action: string,
    resource: string,
    success: boolean = true,
    errorMessage?: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase
        .rpc('log_access', {
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action,
          resource,
          ip_address: null, // Se obtiene del servidor
          user_agent: navigator.userAgent,
          success,
          error_message: errorMessage,
          metadata: metadata || {}
        });

      if (error) {
        console.error('Error registrando acceso:', error);
      }
    } catch (error) {
      console.error('Error en logAccess:', error);
    }
  }, []);

  // Verificar intentos de login
  const checkLoginAttempts = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('check_login_attempts', {
          email,
          ip_address: null // Se obtiene del servidor
        });

      if (error) throw error;

      return data || false;
    } catch (error) {
      console.error('Error verificando intentos de login:', error);
      return true; // En caso de error, permitir login
    }
  }, []);

  // Registrar intento de login
  const logLoginAttempt = useCallback(async (
    email: string,
    success: boolean,
    userAgent?: string
  ) => {
    try {
      const { error } = await supabase
        .rpc('log_login_attempt', {
          email,
          ip_address: null, // Se obtiene del servidor
          success,
          user_agent: userAgent || navigator.userAgent
        });

      if (error) {
        console.error('Error registrando intento de login:', error);
      }
    } catch (error) {
      console.error('Error en logLoginAttempt:', error);
    }
  }, []);

  // Obtener actividad reciente
  const getRecentActivity = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_recent_activity')
        .select('*')
        .limit(20);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error obteniendo actividad reciente:', error);
      return [];
    }
  }, []);

  // Obtener dashboard de seguridad
  const getSecurityDashboard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('security_dashboard')
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error obteniendo dashboard de seguridad:', error);
      return null;
    }
  }, []);

  // Configurar 2FA
  const setup2FA = useCallback(async (secretKey: string, verificationCode: string) => {
    try {
      // En una implementación real, aquí verificarías el código con el servidor
      // Por ahora, simulamos la verificación
      if (verificationCode.length === 6) {
        setHas2FA(true);
        
        // Registrar la configuración de 2FA
        await logAccess('2FA_SETUP', 'security_settings', true);
        
        toast({
          title: '2FA Configurado',
          description: 'La autenticación de dos factores está ahora activa',
        });
        
        return true;
      } else {
        throw new Error('Código de verificación inválido');
      }
    } catch (error) {
      await logAccess('2FA_SETUP', 'security_settings', false, error.message);
      
      toast({
        title: 'Error',
        description: 'No se pudo configurar 2FA. Verifica el código.',
        variant: 'destructive'
      });
      
      return false;
    }
  }, [logAccess]);

  // Desactivar 2FA
  const disable2FA = useCallback(async () => {
    try {
      setHas2FA(false);
      
      // Registrar la desactivación de 2FA
      await logAccess('2FA_DISABLE', 'security_settings', true);
      
      toast({
        title: '2FA Desactivado',
        description: 'La autenticación de dos factores ha sido desactivada',
      });
    } catch (error) {
      await logAccess('2FA_DISABLE', 'security_settings', false, error.message);
      
      toast({
        title: 'Error',
        description: 'No se pudo desactivar 2FA',
        variant: 'destructive'
      });
    }
  }, [logAccess]);

  // Validar contraseña segura
  const validatePassword = useCallback((password: string): {
    isValid: boolean;
    score: number;
    requirements: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      number: boolean;
      special: boolean;
    };
  } => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const validCount = Object.values(requirements).filter(Boolean).length;
    const score = (validCount / 5) * 100;
    const isValid = validCount === 5;

    return {
      isValid,
      score,
      requirements
    };
  }, []);

  // Obtener nivel de seguridad
  const getSecurityLevel = useCallback(() => {
    let score = 0;
    if (has2FA) score += 40;
    if (isSecureConnection) score += 30;
    if (securityStats?.failedLoginsToday === 0) score += 30;

    if (score >= 90) return { level: 'Excelente', color: 'green' };
    if (score >= 70) return { level: 'Bueno', color: 'blue' };
    if (score >= 50) return { level: 'Regular', color: 'yellow' };
    return { level: 'Bajo', color: 'red' };
  }, [has2FA, isSecureConnection, securityStats]);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    getSecurityStats();
  }, [getSecurityStats]);

  return {
    // Estados
    securityStats,
    isLoading,
    has2FA,
    isSecureConnection,
    
    // Funciones
    getSecurityStats,
    logAccess,
    checkLoginAttempts,
    logLoginAttempt,
    getRecentActivity,
    getSecurityDashboard,
    setup2FA,
    disable2FA,
    validatePassword,
    getSecurityLevel,
    
    // Setters
    setHas2FA
  };
}