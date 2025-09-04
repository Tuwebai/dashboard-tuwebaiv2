-- =====================================================
-- ACTUALIZAR APPROVAL_STATUS DE PROYECTOS EXISTENTES
-- =====================================================

-- 1. Verificar si la columna approval_status existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'approval_status') THEN
        ALTER TABLE public.projects
        ADD COLUMN approval_status character varying DEFAULT 'approved'::character varying
        CHECK (approval_status = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]));
        
        RAISE NOTICE 'Columna approval_status agregada.';
    ELSE
        RAISE NOTICE 'Columna approval_status ya existe.';
    END IF;
END $$;

-- 2. Actualizar proyectos existentes que no tienen approval_status
UPDATE public.projects 
SET approval_status = 'approved'
WHERE approval_status IS NULL;

-- 3. Verificar los resultados
SELECT 
    name,
    approval_status,
    created_at
FROM public.projects 
ORDER BY created_at DESC
LIMIT 10;

-- 4. Mensaje final
DO $$
BEGIN
    RAISE NOTICE 'Approval status de proyectos existentes actualizado.';
END $$;
