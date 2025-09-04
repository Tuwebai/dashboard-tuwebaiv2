-- =====================================================
-- RECHAZAR UN PROYECTO PARA TESTING
-- =====================================================

-- 1. Ver proyectos disponibles
SELECT 
    id,
    name,
    approval_status,
    created_by
FROM public.projects 
ORDER BY created_at DESC
LIMIT 5;

-- 2. Rechazar el primer proyecto (cambiar el ID según sea necesario)
-- IMPORTANTE: Cambia el ID por uno real de tu base de datos
UPDATE public.projects 
SET 
    approval_status = 'rejected',
    updated_at = NOW()
WHERE id = (
    SELECT id 
    FROM public.projects 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- 3. Verificar el cambio
SELECT 
    id,
    name,
    approval_status,
    updated_at
FROM public.projects 
WHERE approval_status = 'rejected'
ORDER BY updated_at DESC
LIMIT 3;

-- 4. Mensaje final
DO $$
BEGIN
    RAISE NOTICE 'Proyecto rechazado para testing.';
END $$;
