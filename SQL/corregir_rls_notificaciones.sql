-- =====================================================
-- CORREGIR RLS PARA TABLA SCHEDULED_NOTIFICATIONS
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Crear política para que los admins puedan INSERTAR notificaciones
CREATE POLICY "Admins can insert scheduled notifications" ON public.scheduled_notifications
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Crear política para que los admins puedan VER todas las notificaciones
CREATE POLICY "Admins can view all scheduled notifications" ON public.scheduled_notifications
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Crear política para que los admins puedan ACTUALIZAR notificaciones
CREATE POLICY "Admins can update scheduled notifications" ON public.scheduled_notifications
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Crear política para que los admins puedan ELIMINAR notificaciones
CREATE POLICY "Admins can delete scheduled notifications" ON public.scheduled_notifications
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Crear política para que los usuarios vean solo sus propias notificaciones
CREATE POLICY "Users can view own scheduled notifications" ON public.scheduled_notifications
    FOR SELECT 
    TO authenticated
    USING (
        user_id = auth.uid()
    );

-- =====================================================
-- CORREGIR RLS PARA TABLA NOTIFICATION_ANALYTICS
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;

-- Crear política para que los admins puedan INSERTAR analytics
CREATE POLICY "Admins can insert notification analytics" ON public.notification_analytics
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Crear política para que los admins puedan VER todos los analytics
CREATE POLICY "Admins can view all notification analytics" ON public.notification_analytics
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Crear política para que los admins puedan ACTUALIZAR analytics
CREATE POLICY "Admins can update notification analytics" ON public.notification_analytics
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- =====================================================
-- VERIFICAR QUE LAS POLÍTICAS SE CREARON
-- =====================================================

-- Mostrar políticas de scheduled_notifications
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'scheduled_notifications';

-- Mostrar políticas de notification_analytics
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notification_analytics';
