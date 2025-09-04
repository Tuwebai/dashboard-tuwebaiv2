-- Script para corregir la tabla notification_channels
-- Agregar la columna 'enabled' si no existe

-- Verificar si la columna 'enabled' existe, si no, agregarla
DO $$
BEGIN
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

-- Verificar si la columna 'types' existe, si no, agregarla
DO $$
BEGIN
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
END $$;

-- Verificar si la columna 'settings' existe, si no, agregarla
DO $$
BEGIN
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
END $$;

-- Verificar si la columna 'updated_at' existe, si no, agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_channels' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.notification_channels 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Crear el trigger para updated_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name = 'update_notification_channels_updated_at'
    ) THEN
        CREATE TRIGGER update_notification_channels_updated_at 
            BEFORE UPDATE ON public.notification_channels 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Crear el índice si no existe
CREATE INDEX IF NOT EXISTS idx_notification_channels_enabled ON public.notification_channels(enabled);
CREATE INDEX IF NOT EXISTS idx_notification_channels_name ON public.notification_channels(name);

-- Habilitar RLS si no está habilitado
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para recrearlas)
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

-- Insertar canales de notificación por defecto si no existen
INSERT INTO public.notification_channels (name, display_name, description, types, settings) VALUES
('Sistema', 'Sistema', 'Notificaciones del sistema y alertas importantes', ARRAY['push', 'email'], '{"sound": true, "vibration": true, "badge": true, "priority": "high"}'),
('Proyectos', 'Proyectos', 'Actualizaciones de proyectos y tareas', ARRAY['push', 'email'], '{"sound": true, "vibration": false, "badge": true, "priority": "normal"}'),
('Equipo', 'Equipo', 'Notificaciones relacionadas con el equipo', ARRAY['push', 'email'], '{"sound": false, "vibration": true, "badge": true, "priority": "normal"}'),
('Pagos', 'Pagos', 'Notificaciones de pagos y facturación', ARRAY['push', 'email'], '{"sound": true, "vibration": true, "badge": true, "priority": "high"}'),
('Marketing', 'Marketing', 'Promociones y actualizaciones de producto', ARRAY['email'], '{"sound": false, "vibration": false, "badge": false, "priority": "low"}')
ON CONFLICT (name) DO NOTHING;
