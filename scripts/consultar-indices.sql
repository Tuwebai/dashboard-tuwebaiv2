-- Script para consultar índices
-- Ejecutar en el SQL Editor de Supabase

-- 1. Todos los índices
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 2. Índices por tabla
SELECT 
    tablename,
    COUNT(*) as total_indices
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
