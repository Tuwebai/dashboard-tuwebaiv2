    -- Script simple y seguro para corregir notification_channels
    -- Evita problemas de restricciones CHECK usando solo valores básicos

    -- Eliminar toda la tabla y recrearla desde cero
    DROP TABLE IF EXISTS public.notification_channels CASCADE;

    -- Crear la tabla notification_channels desde cero
    CREATE TABLE public.notification_channels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL DEFAULT '',
        description TEXT,
        type TEXT NOT NULL DEFAULT 'general',
        types TEXT[] NOT NULL DEFAULT '{}',
        settings JSONB NOT NULL DEFAULT '{"sound": true, "vibration": true, "badge": true, "priority": "normal"}',
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Crear índices
    CREATE INDEX idx_notification_channels_enabled ON public.notification_channels(enabled);
    CREATE INDEX idx_notification_channels_name ON public.notification_channels(name);
    CREATE INDEX idx_notification_channels_type ON public.notification_channels(type);

    -- Crear trigger para updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_notification_channels_updated_at 
        BEFORE UPDATE ON public.notification_channels 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();

    -- Habilitar RLS
    ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;

    -- Crear políticas RLS
    CREATE POLICY "Everyone can view enabled notification channels" ON public.notification_channels
        FOR SELECT USING (enabled = true);

    CREATE POLICY "Admins can manage notification channels" ON public.notification_channels
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );

    -- Insertar canales de notificación por defecto
    INSERT INTO public.notification_channels (name, display_name, description, type, types, settings, enabled) VALUES
    ('Sistema', 'Sistema', 'Notificaciones del sistema y alertas importantes', 'general', ARRAY['push', 'email'], '{"sound": true, "vibration": true, "badge": true, "priority": "high"}', true),
    ('Proyectos', 'Proyectos', 'Actualizaciones de proyectos y tareas', 'general', ARRAY['push', 'email'], '{"sound": true, "vibration": false, "badge": true, "priority": "normal"}', true),
    ('Equipo', 'Equipo', 'Notificaciones relacionadas con el equipo', 'general', ARRAY['push', 'email'], '{"sound": false, "vibration": true, "badge": true, "priority": "normal"}', true),
    ('Pagos', 'Pagos', 'Notificaciones de pagos y facturación', 'general', ARRAY['push', 'email'], '{"sound": true, "vibration": true, "badge": true, "priority": "high"}', true),
    ('Marketing', 'Marketing', 'Promociones y actualizaciones de producto', 'general', ARRAY['email'], '{"sound": false, "vibration": false, "badge": false, "priority": "low"}', true);
