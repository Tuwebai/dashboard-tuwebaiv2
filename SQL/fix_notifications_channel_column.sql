-- Script para corregir la tabla notifications y añadir columna channel
-- Ejecutar antes de create_advanced_notification_tables.sql

-- Verificar si la tabla notifications existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Crear tabla notifications si no existe
        CREATE TABLE public.notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'info',
            channel TEXT NOT NULL DEFAULT 'in-app',
            is_read BOOLEAN DEFAULT FALSE,
            data JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Habilitar RLS
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        
        -- Crear políticas RLS
        CREATE POLICY "Users can view their own notifications" ON public.notifications
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can update their own notifications" ON public.notifications
            FOR UPDATE USING (auth.uid() = user_id);
            
        CREATE POLICY "System can insert notifications" ON public.notifications
            FOR INSERT WITH CHECK (true);
            
        -- Crear índices
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
        CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
        CREATE INDEX IF NOT EXISTS idx_notifications_channel ON public.notifications(channel);
        
        -- Crear trigger para updated_at
        CREATE TRIGGER update_notifications_updated_at
            BEFORE UPDATE ON public.notifications
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabla notifications creada exitosamente';
    ELSE
        -- Verificar si la columna channel existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'channel') THEN
            -- Añadir columna channel
            ALTER TABLE public.notifications ADD COLUMN channel TEXT NOT NULL DEFAULT 'in-app';
            
            -- Crear índice para la nueva columna
            CREATE INDEX IF NOT EXISTS idx_notifications_channel ON public.notifications(channel);
            
            RAISE NOTICE 'Columna channel añadida a la tabla notifications';
        ELSE
            RAISE NOTICE 'La columna channel ya existe en la tabla notifications';
        END IF;
    END IF;
END $$;

-- Verificar que la función update_updated_at_column existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentarios en la tabla
COMMENT ON TABLE public.notifications IS 'Tabla principal de notificaciones del sistema';
COMMENT ON COLUMN public.notifications.channel IS 'Canal de notificación: in-app, email, push, sms, webhook';
COMMENT ON COLUMN public.notifications.type IS 'Tipo de notificación: info, warning, error, success';
COMMENT ON COLUMN public.notifications.data IS 'Datos adicionales en formato JSON';

-- Verificar estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

