-- Tablas para el sistema de seguridad

-- Tabla para eventos de seguridad
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('rate_limit', 'suspicious_activity', 'auth_failure', 'csrf_violation')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip INET,
    user_agent TEXT,
    details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para bloqueos de usuarios
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    blocked_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla para suscripciones push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Una suscripción por usuario
    UNIQUE(user_id)
);

-- Tabla para configuración de notificaciones de usuario
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channels JSONB NOT NULL DEFAULT '{}',
    global_enabled BOOLEAN NOT NULL DEFAULT true,
    quiet_hours JSONB NOT NULL DEFAULT '{"enabled": false, "start": "22:00", "end": "08:00", "timezone": "UTC"}',
    frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'digest', 'disabled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Una configuración por usuario
    UNIQUE(user_id)
);

-- Tabla para canales de notificación
CREATE TABLE IF NOT EXISTS public.notification_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT true,
    types TEXT[] NOT NULL DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{"sound": true, "vibration": true, "badge": true, "priority": "normal"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para notificaciones programadas
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(type);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events(ip);

CREATE INDEX IF NOT EXISTS idx_user_blocks_user_id ON public.user_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_until ON public.user_blocks(blocked_until);
CREATE INDEX IF NOT EXISTS idx_user_blocks_created_at ON public.user_blocks(created_at);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at ON public.push_subscriptions(created_at);

CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON public.user_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_updated_at ON public.user_notification_settings(updated_at);

CREATE INDEX IF NOT EXISTS idx_notification_channels_enabled ON public.notification_channels(enabled);
CREATE INDEX IF NOT EXISTS idx_notification_channels_name ON public.notification_channels(name);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON public.scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_time ON public.scheduled_notifications(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON public.scheduled_notifications(status);

-- Habilitar RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para security_events
CREATE POLICY "Users can view own security events" ON public.security_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security events" ON public.security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas RLS para user_blocks
CREATE POLICY "Users can view own blocks" ON public.user_blocks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all blocks" ON public.user_blocks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas RLS para push_subscriptions
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para user_notification_settings
CREATE POLICY "Users can manage own notification settings" ON public.user_notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para notification_channels
CREATE POLICY "Everyone can view enabled notification channels" ON public.notification_channels
    FOR SELECT USING (enabled = true);

CREATE POLICY "Admins can manage notification channels" ON public.notification_channels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas RLS para scheduled_notifications
CREATE POLICY "Users can view own scheduled notifications" ON public.scheduled_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own scheduled notifications" ON public.scheduled_notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled notifications" ON public.scheduled_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_push_subscriptions_updated_at 
    BEFORE UPDATE ON public.push_subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_settings_updated_at 
    BEFORE UPDATE ON public.user_notification_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_channels_updated_at 
    BEFORE UPDATE ON public.notification_channels 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Función para limpiar datos antiguos
CREATE OR REPLACE FUNCTION cleanup_old_security_data()
RETURNS void AS $$
BEGIN
    -- Limpiar eventos de seguridad antiguos (más de 30 días)
    DELETE FROM public.security_events 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Limpiar bloqueos expirados
    DELETE FROM public.user_blocks 
    WHERE blocked_until < NOW();
    
    -- Limpiar notificaciones programadas antiguas (más de 7 días)
    DELETE FROM public.scheduled_notifications 
    WHERE created_at < NOW() - INTERVAL '7 days' 
    AND status IN ('sent', 'failed', 'cancelled');
END;
$$ LANGUAGE plpgsql;

-- Programar limpieza automática (requiere pg_cron)
-- SELECT cron.schedule('cleanup-security-data', '0 2 * * *', 'SELECT cleanup_old_security_data();');

-- Insertar canales de notificación por defecto
INSERT INTO public.notification_channels (name, display_name, description, types, settings) VALUES
('Sistema', 'Sistema', 'Notificaciones del sistema y alertas importantes', ARRAY['push', 'email'], '{"sound": true, "vibration": true, "badge": true, "priority": "high"}'),
('Proyectos', 'Proyectos', 'Actualizaciones de proyectos y tareas', ARRAY['push', 'email'], '{"sound": true, "vibration": false, "badge": true, "priority": "normal"}'),
('Equipo', 'Equipo', 'Notificaciones relacionadas con el equipo', ARRAY['push', 'email'], '{"sound": false, "vibration": true, "badge": true, "priority": "normal"}'),
('Pagos', 'Pagos', 'Notificaciones de pagos y facturación', ARRAY['push', 'email'], '{"sound": true, "vibration": true, "badge": true, "priority": "high"}'),
('Marketing', 'Marketing', 'Promociones y actualizaciones de producto', ARRAY['email'], '{"sound": false, "vibration": false, "badge": false, "priority": "low"}')
ON CONFLICT DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE public.security_events IS 'Registra eventos de seguridad del sistema';
COMMENT ON TABLE public.user_blocks IS 'Bloqueos temporales de usuarios por actividad sospechosa';
COMMENT ON TABLE public.push_subscriptions IS 'Suscripciones a notificaciones push de usuarios';
COMMENT ON TABLE public.user_notification_settings IS 'Configuración de notificaciones por usuario';
COMMENT ON TABLE public.notification_channels IS 'Canales de notificación disponibles';
COMMENT ON TABLE public.scheduled_notifications IS 'Notificaciones programadas para envío futuro';
