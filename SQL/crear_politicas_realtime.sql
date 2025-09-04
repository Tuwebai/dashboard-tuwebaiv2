-- =====================================================
-- CREAR POLÍTICAS DE REALTIME PARA PROYECTOS
-- =====================================================

-- Verificar si las políticas ya existen antes de crearlas
DO $$
BEGIN
    -- Crear política para usuarios normales (si no existe)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projects' 
        AND policyname = 'Users can listen to their own projects'
    ) THEN
        CREATE POLICY "Users can listen to their own projects" ON public.projects
        FOR SELECT USING (auth.uid() = created_by);
        RAISE NOTICE 'Política "Users can listen to their own projects" creada';
    ELSE
        RAISE NOTICE 'Política "Users can listen to their own projects" ya existe';
    END IF;

    -- Crear política para administradores (si no existe)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projects' 
        AND policyname = 'Admins can listen to all projects'
    ) THEN
        CREATE POLICY "Admins can listen to all projects" ON public.projects
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
        RAISE NOTICE 'Política "Admins can listen to all projects" creada';
    ELSE
        RAISE NOTICE 'Política "Admins can listen to all projects" ya existe';
    END IF;
END $$;

-- Verificar el estado de las políticas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY policyname;

-- Verificar que Realtime esté habilitado para la tabla
SELECT 
    schemaname,
    tablename,
    hasrls
FROM pg_tables 
WHERE tablename = 'projects';

-- Verificar que la tabla esté en la publicación de Realtime
SELECT 
    pubname,
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE tablename = 'projects' 
AND pubname = 'supabase_realtime';
