-- Script para consultar columnas de todas las tablas
-- Ejecutar en el SQL Editor de Supabase

-- 1. Columnas de todas las tablas con detalles
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.character_maximum_length,
    c.ordinal_position
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND c.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- 2. Solo columnas de tablas principales de la app
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND c.table_schema = 'public'
    AND t.table_name IN ('users', 'projects', 'tickets', 'notifications', 'chat_history', 'websy_memory', 'user_preferences', 'automation_tasks')
ORDER BY t.table_name, c.ordinal_position;
