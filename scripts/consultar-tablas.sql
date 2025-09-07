-- Script para consultar todas las tablas de la base de datos
-- Ejecutar en el SQL Editor de Supabase

-- 1. Listar todas las tablas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Contar total de tablas
SELECT COUNT(*) as total_tablas
FROM information_schema.tables 
WHERE table_schema = 'public';
