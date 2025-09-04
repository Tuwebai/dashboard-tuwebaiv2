-- Script simple para corregir el error de la columna 'enabled'

-- Agregar la columna 'enabled' a notification_channels si no existe
ALTER TABLE public.notification_channels 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;

-- Crear el índice si no existe
CREATE INDEX IF NOT EXISTS idx_notification_channels_enabled ON public.notification_channels(enabled);

-- Eliminar y recrear las políticas RLS para notification_channels
DROP POLICY IF EXISTS "Everyone can view enabled notification channels" ON public.notification_channels;
DROP POLICY IF EXISTS "Admins can manage notification channels" ON public.notification_channels;

-- Recrear las políticas
CREATE POLICY "Everyone can view enabled notification channels" ON public.notification_channels
    FOR SELECT USING (enabled = true);

CREATE POLICY "Admins can manage notification channels" ON public.notification_channels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
