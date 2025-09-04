-- Script final para corregir la tabla notification_channels
-- Verifica las restricciones CHECK y usa solo valores permitidos

-- Primero, verificar qué restricciones CHECK existen en la tabla
-- SELECT conname, consrc FROM pg_constraint WHERE conrelid = 'public.notification_channels'::regclass AND contype = 'c';

-- Verificar y agregar columnas faltantes
DO $$
BEGIN
    -- Agregar display_name si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_channels' 
        AND column_name = 'display_name'
    ) THEN
        ALTER TABLE public.notification_channels 
        ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
    END IF;

    -- Agregar type si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_channels' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE public.notification_channels 
        ADD COLUMN type TEXT NOT NULL DEFAULT 'general';
    END IF;

    -- Agregar types si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_channels' 
        AND column_name = 'types'
    ) THEN
        ALTER TABLE public.notification_channels 
        ADD COLUMN types TEXT[] NOT NULL DEFAULT '{}';
    END IF;

    -- Agregar settings si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_channels' 
        AND column_name = 'settings'
    ) THEN
        ALTER TABLE public.notification_channels 
        ADD COLUMN settings JSONB NOT NULL DEFAULT '{"sound": true, "vibration": true, "badge": true, "priority": "normal"}';
    END IF;

    -- Agregar enabled si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_channels' 
        AND column_name = 'enabled'
    ) THEN
        ALTER TABLE public.notification_channels 
        ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- Eliminar restricciones CHECK problemáticas si existen
ALTER TABLE public.notification_channels DROP CONSTRAINT IF EXISTS notification_channels_type_check;

-- Limpiar tabla existente (eliminar registros problemáticos)
DELETE FROM public.notification_channels;

-- Insertar canales de notificación por defecto con valores seguros
INSERT INTO public.notification_channels (name, display_name, description, type, types, settings, enabled) VALUES
('Sistema', 'Sistema', 'Notificaciones del sistema y alertas importantes', 'general', ARRAY['push', 'email'], '{"sound": true, "vibration": true, "badge": true, "priority": "high"}', true),
('Proyectos', 'Proyectos', 'Actualizaciones de proyectos y tareas', 'general', ARRAY['push', 'email'], '{"sound": true, "vibration": false, "badge": true, "priority": "normal"}', true),
('Equipo', 'Equipo', 'Notificaciones relacionadas con el equipo', 'general', ARRAY['push', 'email'], '{"sound": false, "vibration": true, "badge": true, "priority": "normal"}', true),
('Pagos', 'Pagos', 'Notificaciones de pagos y facturación', 'general', ARRAY['push', 'email'], '{"sound": true, "vibration": true, "badge": true, "priority": "high"}', true),
('Marketing', 'Marketing', 'Promociones y actualizaciones de producto', 'general', ARRAY['email'], '{"sound": false, "vibration": false, "badge": false, "priority": "low"}', true);

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_notification_channels_enabled ON public.notification_channels(enabled);
CREATE INDEX IF NOT EXISTS idx_notification_channels_name ON public.notification_channels(name);
CREATE INDEX IF NOT EXISTS idx_notification_channels_type ON public.notification_channels(type);

-- Habilitar RLS si no está habilitado
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Everyone can view enabled notification channels" ON public.notification_channels;
DROP POLICY IF EXISTS "Admins can manage notification channels" ON public.notification_channels;

-- Crear las políticas RLS
CREATE POLICY "Everyone can view enabled notification channels" ON public.notification_channels
    FOR SELECT USING (enabled = true);

CREATE POLICY "Admins can manage notification channels" ON public.notification_channels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
