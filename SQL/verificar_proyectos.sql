-- =====================================================
-- VERIFICAR ESTADO DE PROYECTOS
-- =====================================================

-- 1. Verificar si las columnas existen
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('approval_status', 'type')
ORDER BY column_name;

-- 2. Ver todos los proyectos con su estado actual
SELECT 
    id,
    name,
    approval_status,
    type,
    created_by,
    created_at
FROM public.projects 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Contar proyectos por estado de aprobación
SELECT 
    approval_status,
    COUNT(*) as cantidad
FROM public.projects 
GROUP BY approval_status;

-- 4. Contar proyectos por tipo
SELECT 
    type,
    COUNT(*) as cantidad
FROM public.projects 
GROUP BY type;
