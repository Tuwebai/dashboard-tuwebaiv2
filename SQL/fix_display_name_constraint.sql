-- Script para corregir el error de la columna display_name

-- Verificar si la columna 'display_name' existe, si no, agregarla
DO $$
BEGIN
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
END $$;

-- Actualizar registros existentes que tengan display_name NULL
UPDATE public.notification_channels 
SET display_name = name 
WHERE display_name IS NULL OR display_name = '';

-- Actualizar registros existentes que tengan type NULL
UPDATE public.notification_channels 
SET type = CASE 
    WHEN name = 'Sistema' THEN 'system'
    WHEN name = 'Proyectos' THEN 'project'
    WHEN name = 'Equipo' THEN 'team'
    WHEN name = 'Pagos' THEN 'payment'
    WHEN name = 'Marketing' THEN 'marketing'
    ELSE 'general'
END
WHERE type IS NULL OR type = '';

-- Eliminar registros duplicados si existen (mantener solo el más reciente)
DELETE FROM public.notification_channels 
WHERE id NOT IN (
    SELECT DISTINCT ON (name) id 
    FROM public.notification_channels 
    ORDER BY name, created_at DESC
);

-- Insertar canales de notificación por defecto si no existen
INSERT INTO public.notification_channels (name, display_name, description, type, types, settings) VALUES
('Sistema', 'Sistema', 'Notificaciones del sistema y alertas importantes', 'system', ARRAY['push', 'email'], '{"sound": true, "vibration": true, "badge": true, "priority": "high"}'),
('Proyectos', 'Proyectos', 'Actualizaciones de proyectos y tareas', 'project', ARRAY['push', 'email'], '{"sound": true, "vibration": false, "badge": true, "priority": "normal"}'),
('Equipo', 'Equipo', 'Notificaciones relacionadas con el equipo', 'team', ARRAY['push', 'email'], '{"sound": false, "vibration": true, "badge": true, "priority": "normal"}'),
('Pagos', 'Pagos', 'Notificaciones de pagos y facturación', 'payment', ARRAY['push', 'email'], '{"sound": true, "vibration": true, "badge": true, "priority": "high"}'),
('Marketing', 'Marketing', 'Promociones y actualizaciones de producto', 'marketing', ARRAY['email'], '{"sound": false, "vibration": false, "badge": false, "priority": "low"}')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    types = EXCLUDED.types,
    settings = EXCLUDED.settings,
    updated_at = NOW();
