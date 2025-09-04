-- =====================================================
-- ACTUALIZAR TIPOS DE PROYECTOS EXISTENTES
-- =====================================================

-- Función para detectar tipo basado en el nombre del proyecto
CREATE OR REPLACE FUNCTION detect_project_type(project_name TEXT, project_description TEXT DEFAULT '')
RETURNS TEXT AS $$
BEGIN
    -- Convertir a minúsculas para comparación
    project_name := LOWER(project_name);
    project_description := LOWER(COALESCE(project_description, ''));
    
    -- Detectar tipos basado en palabras clave
    IF project_name LIKE '%landing%' OR project_name LIKE '%conversión%' OR project_description LIKE '%landing%' THEN
        RETURN 'Landing Page';
    ELSIF project_name LIKE '%tienda%' OR project_name LIKE '%ecommerce%' OR project_name LIKE '%shop%' OR project_description LIKE '%tienda%' THEN
        RETURN 'E-commerce';
    ELSIF project_name LIKE '%empresa%' OR project_name LIKE '%corporativo%' OR project_name LIKE '%business%' OR project_description LIKE '%empresa%' THEN
        RETURN 'Corporativo';
    ELSIF project_name LIKE '%portfolio%' OR project_name LIKE '%portafolio%' OR project_description LIKE '%portfolio%' THEN
        RETURN 'Portfolio';
    ELSIF project_name LIKE '%blog%' OR project_name LIKE '%noticias%' OR project_description LIKE '%blog%' THEN
        RETURN 'Blog';
    ELSIF project_name LIKE '%app%' OR project_name LIKE '%móvil%' OR project_name LIKE '%mobile%' OR project_description LIKE '%app%' THEN
        RETURN 'App Móvil';
    ELSIF project_name LIKE '%sistema%' OR project_name LIKE '%dashboard%' OR project_name LIKE '%admin%' OR project_description LIKE '%sistema%' THEN
        RETURN 'Aplicación Web';
    ELSIF project_name LIKE '%diseño%' OR project_name LIKE '%ui%' OR project_name LIKE '%ux%' OR project_description LIKE '%diseño%' THEN
        RETURN 'Diseño UI/UX';
    ELSIF project_name LIKE '%api%' OR project_name LIKE '%backend%' OR project_name LIKE '%servidor%' OR project_description LIKE '%api%' THEN
        RETURN 'API/Backend';
    ELSIF project_name LIKE '%base de datos%' OR project_name LIKE '%database%' OR project_name LIKE '%sql%' OR project_description LIKE '%base de datos%' THEN
        RETURN 'Base de Datos';
    ELSE
        RETURN 'Desarrollo';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Actualizar proyectos existentes que no tienen tipo asignado
UPDATE public.projects 
SET type = detect_project_type(name, description)
WHERE type IS NULL OR type = '';

-- Verificar los resultados
SELECT 
    name,
    type,
    CASE 
        WHEN type IS NULL THEN 'Sin tipo'
        ELSE type
    END as tipo_actual
FROM public.projects 
ORDER BY created_at DESC
LIMIT 10;

-- Limpiar la función temporal
DROP FUNCTION IF EXISTS detect_project_type(TEXT, TEXT);

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE 'Tipos de proyectos existentes actualizados.';
END $$;
