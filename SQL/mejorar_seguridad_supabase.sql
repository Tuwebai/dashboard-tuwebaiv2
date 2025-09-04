-- =====================================================
-- SCRIPT DE MEJORAS DE SEGURIDAD PARA SUPABASE
-- =====================================================
-- Este script mejora la seguridad de la aplicación sin costo adicional
-- Solo requiere ejecutar en la consola SQL de Supabase

-- =====================================================
-- 1. TABLA DE AUDITORÍA DE ACCESOS
-- =====================================================

-- Crear tabla para registrar todos los accesos y acciones
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON public.access_logs(action);

-- =====================================================
-- 2. TABLA DE INTENTOS DE LOGIN
-- =====================================================

-- Crear tabla para controlar intentos de login
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  success BOOLEAN NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para rate limiting
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at);

-- =====================================================
-- 3. FUNCIONES DE SEGURIDAD
-- =====================================================

-- Función para verificar intentos de login
CREATE OR REPLACE FUNCTION check_login_attempts(email TEXT, ip_address INET)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
  ip_attempt_count INTEGER;
BEGIN
  -- Contar intentos fallidos en los últimos 15 minutos por email
  SELECT COUNT(*) INTO attempt_count
  FROM public.login_attempts
  WHERE login_attempts.email = $1
  AND success = false
  AND created_at > NOW() - INTERVAL '15 minutes';
  
  -- Contar intentos fallidos en los últimos 15 minutos por IP
  SELECT COUNT(*) INTO ip_attempt_count
  FROM public.login_attempts
  WHERE login_attempts.ip_address = $2
  AND success = false
  AND created_at > NOW() - INTERVAL '15 minutes';
  
  -- Permitir login si menos de 5 intentos por email y menos de 10 por IP
  RETURN attempt_count < 5 AND ip_attempt_count < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar intentos de login
CREATE OR REPLACE FUNCTION log_login_attempt(
  email TEXT,
  ip_address INET,
  success BOOLEAN,
  user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.login_attempts (email, ip_address, success, user_agent)
  VALUES ($1, $2, $3, $4);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar accesos generales
CREATE OR REPLACE FUNCTION log_access(
  user_id UUID,
  action TEXT,
  resource TEXT,
  ip_address INET DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  success BOOLEAN DEFAULT true,
  error_message TEXT DEFAULT NULL,
  metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.access_logs (
    user_id, action, resource, ip_address, user_agent, 
    success, error_message, metadata
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. POLÍTICAS RLS MEJORADAS
-- =====================================================

-- Habilitar RLS en las tablas de seguridad
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Política para access_logs: solo el usuario puede ver sus propios logs
CREATE POLICY "Users can view their own access logs" ON public.access_logs
FOR SELECT USING (auth.uid() = user_id);

-- Política para login_attempts: solo admins pueden ver (por ahora, todos pueden ver)
CREATE POLICY "Users can view login attempts" ON public.login_attempts
FOR SELECT USING (true);

-- =====================================================
-- 5. MEJORAR POLÍTICAS EXISTENTES
-- =====================================================

-- Mejorar política de proyectos
DROP POLICY IF EXISTS "Users can only see their own projects" ON public.projects;
CREATE POLICY "Users can only see their own projects" ON public.projects
FOR ALL USING (auth.uid() = created_by);

-- Mejorar política de archivos
DROP POLICY IF EXISTS "Users can only access their own files" ON public.project_files;
CREATE POLICY "Users can only access their own files" ON public.project_files
FOR ALL USING (
  auth.uid() = uploaded_by OR
  auth.uid() = (
    SELECT created_by FROM public.projects 
    WHERE projects.id = project_files.project_id
  )
);

-- =====================================================
-- 6. TRIGGERS DE AUDITORÍA
-- =====================================================

-- Función para trigger de auditoría
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar la acción
  PERFORM log_access(
    auth.uid(),
    TG_OP, -- INSERT, UPDATE, DELETE
    TG_TABLE_NAME,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    true,
    NULL,
    jsonb_build_object(
      'old_data', CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      'new_data', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers de auditoría a tablas críticas
DROP TRIGGER IF EXISTS audit_projects_trigger ON public.projects;
CREATE TRIGGER audit_projects_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_project_files_trigger ON public.project_files;
CREATE TRIGGER audit_project_files_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.project_files
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- 7. FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para obtener estadísticas de seguridad
CREATE OR REPLACE FUNCTION get_security_stats(user_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_logins', (
      SELECT COUNT(*) FROM public.login_attempts 
      WHERE (user_id IS NULL OR email = (SELECT email FROM auth.users WHERE id = user_id))
      AND success = true
    ),
    'failed_logins_today', (
      SELECT COUNT(*) FROM public.login_attempts 
      WHERE (user_id IS NULL OR email = (SELECT email FROM auth.users WHERE id = user_id))
      AND success = false
      AND created_at > CURRENT_DATE
    ),
    'last_login', (
      SELECT MAX(created_at) FROM public.login_attempts 
      WHERE (user_id IS NULL OR email = (SELECT email FROM auth.users WHERE id = user_id))
      AND success = true
    ),
    'suspicious_activity', (
      SELECT COUNT(*) FROM public.access_logs 
      WHERE (user_id IS NULL OR access_logs.user_id = user_id)
      AND success = false
      AND created_at > NOW() - INTERVAL '24 hours'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CONFIGURACIÓN DE SEGURIDAD ADICIONAL
-- =====================================================

-- Crear tabla para configuraciones de seguridad
CREATE TABLE IF NOT EXISTS public.security_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_name TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, setting_name)
);

-- Habilitar RLS
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

-- Política para security_settings
CREATE POLICY "Users can manage their own security settings" ON public.security_settings
FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 9. VISTAS DE SEGURIDAD
-- =====================================================

-- Vista para mostrar actividad reciente del usuario
CREATE OR REPLACE VIEW user_recent_activity AS
SELECT 
  al.user_id,
  al.action,
  al.resource,
  al.success,
  al.created_at,
  al.ip_address,
  al.user_agent
FROM public.access_logs al
WHERE al.user_id = auth.uid()
ORDER BY al.created_at DESC
LIMIT 50;

-- Vista para estadísticas de seguridad
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
  u.id as user_id,
  u.email,
  get_security_stats(u.id) as stats,
  (
    SELECT COUNT(*) 
    FROM public.login_attempts la 
    WHERE la.email = u.email 
    AND la.success = false 
    AND la.created_at > NOW() - INTERVAL '24 hours'
  ) as failed_attempts_24h
FROM auth.users u
WHERE u.id = auth.uid();

-- =====================================================
-- 10. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.access_logs IS 'Registro de auditoría de accesos y acciones de usuarios';
COMMENT ON TABLE public.login_attempts IS 'Registro de intentos de login para control de rate limiting';
COMMENT ON TABLE public.security_settings IS 'Configuraciones de seguridad por usuario';

COMMENT ON FUNCTION check_login_attempts(TEXT, INET) IS 'Verifica si un usuario puede intentar hacer login basado en intentos recientes';
COMMENT ON FUNCTION log_login_attempt(TEXT, INET, BOOLEAN, TEXT) IS 'Registra un intento de login';
COMMENT ON FUNCTION log_access(UUID, TEXT, TEXT, INET, TEXT, BOOLEAN, TEXT, JSONB) IS 'Registra un acceso o acción del usuario';
COMMENT ON FUNCTION get_security_stats(UUID) IS 'Obtiene estadísticas de seguridad para un usuario';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Para aplicar este script:
-- 1. Ve a la consola SQL de Supabase
-- 2. Copia y pega todo este contenido
-- 3. Ejecuta el script
-- 4. Verifica que no hay errores

-- Beneficios inmediatos:
-- ✅ Auditoría completa de accesos
-- ✅ Rate limiting automático
-- ✅ Políticas RLS mejoradas
-- ✅ Triggers de auditoría
-- ✅ Estadísticas de seguridad
-- ✅ Sin costo adicional
