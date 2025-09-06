-- Script para verificar la estructura real de las tablas
-- Ejecutar en la consola SQL de Supabase

-- 1. Verificar estructura de la tabla projects
SELECT 
    'projects' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY column_name;

-- 2. Verificar estructura de la tabla tickets
SELECT 
    'tickets' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tickets' 
ORDER BY column_name;

-- 3. Verificar estructura de la tabla users
SELECT 
    'users' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY column_name;

-- 4. Verificar estructura de la tabla ai_settings
SELECT 
    'ai_settings' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ai_settings' 
ORDER BY column_name;
