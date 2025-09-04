-- =====================================================
-- CONFIGURACIÓN DE REALTIME PARA PROYECTOS
-- =====================================================

-- 1. Habilitar Realtime en la tabla projects (si no está ya habilitado)
DO $$
BEGIN
    -- Verificar si la tabla ya está en la publicación
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'projects' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
        RAISE NOTICE 'Tabla projects agregada a la publicación supabase_realtime';
    ELSE
        RAISE NOTICE 'Tabla projects ya está en la publicación supabase_realtime';
    END IF;
END $$;

-- 2. Crear políticas de Realtime para usuarios normales
CREATE POLICY "Users can listen to their own projects" ON public.projects
FOR SELECT USING (auth.uid() = created_by);

-- 3. Crear políticas de Realtime para administradores
CREATE POLICY "Admins can listen to all projects" ON public.projects
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 4. Verificar que las políticas estén activas
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
WHERE tablename = 'projects';

-- 5. Verificar que Realtime esté habilitado
SELECT 
  schemaname,
  tablename,
  hasrls
FROM pg_tables 
WHERE tablename = 'projects';

-- 6. Comentarios para documentación
COMMENT ON POLICY "Users can listen to their own projects" ON public.projects IS 
'Permite a los usuarios escuchar cambios en tiempo real solo de sus propios proyectos';

COMMENT ON POLICY "Admins can listen to all projects" ON public.projects IS 
'Permite a los administradores escuchar cambios en tiempo real de todos los proyectos';
