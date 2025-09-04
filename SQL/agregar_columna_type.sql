-- =====================================================
-- AGREGAR COLUMNA TYPE A LA TABLA PROJECTS
-- =====================================================

-- 1. Agregar columna type si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'type') THEN
        ALTER TABLE public.projects
        ADD COLUMN type character varying(100);
        
        -- Actualizar proyectos existentes con tipo por defecto
        UPDATE public.projects
        SET type = 'Desarrollo'
        WHERE type IS NULL;
        
        RAISE NOTICE 'Columna type agregada y valores por defecto establecidos.';
    ELSE
        RAISE NOTICE 'Columna type ya existe.';
    END IF;
END $$;

-- 2. Crear índice para type para mejorar el rendimiento de las consultas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'projects' AND indexname = 'idx_projects_type') THEN
        CREATE INDEX idx_projects_type ON public.projects(type);
        RAISE NOTICE 'Índice idx_projects_type creado.';
    ELSE
        RAISE NOTICE 'Índice idx_projects_type ya existe.';
    END IF;
END $$;

-- 3. Verificar que la columna existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'type';

-- 4. Mensaje final
DO $$
BEGIN
    RAISE NOTICE 'Script de adición de columna type ejecutado.';
END $$;
