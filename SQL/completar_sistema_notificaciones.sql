-- =====================================================
-- COMPLETAR SISTEMA DE NOTIFICACIONES AVANZADO
-- =====================================================
-- Solo crea las estructuras necesarias, sin datos de ejemplo

-- 1. VERIFICAR SI FALTAN TABLAS CRÍTICAS
DO $$
BEGIN
    -- Verificar si existe la tabla scheduled_notifications
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scheduled_notifications' AND table_schema = 'public') THEN
        -- Crear tabla para notificaciones programadas
        CREATE TABLE public.scheduled_notifications (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            template_id uuid REFERENCES public.notification_templates(id) ON DELETE SET NULL,
            rule_id uuid REFERENCES public.notification_rules(id) ON DELETE SET NULL,
            channels text[] NOT NULL,
            subject text,
            content text NOT NULL,
            html_content text,
            variables jsonb DEFAULT '{}'::jsonb,
            scheduled_for timestamp with time zone NOT NULL,
            status character varying DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
            attempts integer DEFAULT 0,
            max_attempts integer DEFAULT 3,
            last_attempt_at timestamp with time zone,
            error_message text,
            sent_at timestamp with time zone,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT scheduled_notifications_pkey PRIMARY KEY (id)
        );
        
        -- Habilitar RLS
        ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
        
        -- Crear política: cada usuario solo ve sus notificaciones programadas
        CREATE POLICY "scheduled_notifications_own" ON public.scheduled_notifications
            FOR ALL USING (user_id = auth.uid());
            
        RAISE NOTICE 'Tabla scheduled_notifications creada';
    ELSE
        RAISE NOTICE 'Tabla scheduled_notifications ya existe';
    END IF;
    
    -- Verificar si existe la tabla notification_analytics
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_analytics' AND table_schema = 'public') THEN
        -- Crear tabla para analytics de notificaciones
        CREATE TABLE public.notification_analytics (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            date date NOT NULL,
            channel character varying NOT NULL,
            category character varying NOT NULL,
            sent_count integer DEFAULT 0,
            delivered_count integer DEFAULT 0,
            opened_count integer DEFAULT 0,
            clicked_count integer DEFAULT 0,
            failed_count integer DEFAULT 0,
            bounce_count integer DEFAULT 0,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT notification_analytics_pkey PRIMARY KEY (id),
            CONSTRAINT notification_analytics_date_channel_category_unique UNIQUE (date, channel, category)
        );
        
        -- Habilitar RLS
        ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;
        
        -- Crear política: lectura para todos los usuarios autenticados, escritura solo para admins
        CREATE POLICY "notification_analytics_read_all" ON public.notification_analytics
            FOR SELECT USING (auth.role() = 'authenticated');
            
        CREATE POLICY "notification_analytics_write_admin" ON public.notification_analytics
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE users.id = auth.uid() 
                    AND users.role = 'admin'
                )
            );
            
        RAISE NOTICE 'Tabla notification_analytics creada';
    ELSE
        RAISE NOTICE 'Tabla notification_analytics ya existe';
    END IF;
END $$;

-- 2. CREAR ÍNDICES PARA RENDIMIENTO
-- Índices para scheduled_notifications
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON public.scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON public.scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON public.scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_template_id ON public.scheduled_notifications(template_id);

-- Índices para notification_analytics
CREATE INDEX IF NOT EXISTS idx_notification_analytics_date ON public.notification_analytics(date);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_channel ON public.notification_analytics(channel);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_category ON public.notification_analytics(category);

-- 3. CREAR FUNCIONES DE BASE DE DATOS
-- Función para procesar notificaciones programadas
CREATE OR REPLACE FUNCTION public.process_scheduled_notifications()
RETURNS void AS $$
BEGIN
    -- Actualizar notificaciones programadas que están listas para enviar
    UPDATE public.scheduled_notifications 
    SET status = 'ready'
    WHERE status = 'pending' 
    AND scheduled_for <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar analytics de notificaciones
CREATE OR REPLACE FUNCTION public.update_notification_analytics(
    p_date date,
    p_channel text,
    p_category text,
    p_sent_count integer DEFAULT 0,
    p_delivered_count integer DEFAULT 0,
    p_opened_count integer DEFAULT 0,
    p_clicked_count integer DEFAULT 0,
    p_failed_count integer DEFAULT 0,
    p_bounce_count integer DEFAULT 0
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.notification_analytics (
        date, channel, category, sent_count, delivered_count, 
        opened_count, clicked_count, failed_count, bounce_count
    ) VALUES (
        p_date, p_channel, p_category, p_sent_count, p_delivered_count,
        p_opened_count, p_clicked_count, p_failed_count, p_bounce_count
    )
    ON CONFLICT (date, channel, category) 
    DO UPDATE SET
        sent_count = notification_analytics.sent_count + p_sent_count,
        delivered_count = notification_analytics.delivered_count + p_delivered_count,
        opened_count = notification_analytics.opened_count + p_opened_count,
        clicked_count = notification_analytics.clicked_count + p_clicked_count,
        failed_count = notification_analytics.failed_count + p_failed_count,
        bounce_count = notification_analytics.bounce_count + p_bounce_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. CREAR TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- Trigger para actualizar updated_at en scheduled_notifications
CREATE OR REPLACE FUNCTION public.update_scheduled_notifications_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_scheduled_notifications_updated_at
    BEFORE UPDATE ON public.scheduled_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_scheduled_notifications_updated_at();

-- Trigger para actualizar updated_at en notification_analytics
CREATE OR REPLACE FUNCTION public.update_notification_analytics_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_analytics_updated_at
    BEFORE UPDATE ON public.notification_analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_notification_analytics_updated_at();

-- 5. VERIFICAR ESTRUCTURA COMPLETA
SELECT 'ESTRUCTURA COMPLETADA' as info,
       'Sistema de notificaciones avanzado listo' as mensaje;

-- 6. MOSTRAR TABLAS CREADAS
SELECT 'TABLAS DEL SISTEMA' as info,
       table_name,
       CASE 
           WHEN rowsecurity THEN '✅ RLS HABILITADO'
           ELSE '❌ RLS DESHABILITADO'
       END as estado_rls
FROM pg_tables 
WHERE schemaname = 'public' 
AND table_name IN (
    'notifications',
    'notification_channels', 
    'notification_templates',
    'notification_rules',
    'notification_delivery_logs',
    'user_channel_subscriptions',
    'scheduled_notifications',
    'notification_analytics',
    'push_subscriptions'
)
ORDER BY table_name;
