-- =====================================================
-- AGREGAR COLUMNA FASES A LA TABLA PROJECTS
-- =====================================================

-- 1. Agregar columna fases como JSONB
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS fases jsonb DEFAULT '[]'::jsonb;

-- 2. Agregar columna tareas como JSONB
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS tareas jsonb DEFAULT '[]'::jsonb;

-- 3. Crear índices para mejorar rendimiento en consultas JSONB
CREATE INDEX IF NOT EXISTS idx_projects_fases_gin ON public.projects USING gin (fases);
CREATE INDEX IF NOT EXISTS idx_projects_tareas_gin ON public.projects USING gin (tareas);

-- 4. Agregar comentarios para documentación
COMMENT ON COLUMN public.projects.fases IS 'Array de fases del proyecto en formato JSONB';
COMMENT ON COLUMN public.projects.tareas IS 'Array de tareas del proyecto en formato JSONB';

-- 5. Verificar que las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
AND column_name IN ('fases', 'tareas')
ORDER BY column_name;

-- 6. Mostrar la estructura actualizada de la tabla projects
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;
