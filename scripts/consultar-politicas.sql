-- Script para consultar políticas RLS
-- Ejecutar en el SQL Editor de Supabase

-- 1. Todas las políticas RLS
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2. Tablas sin políticas RLS
SELECT 
    t.table_name
FROM information_schema.tables t
LEFT JOIN pg_policies p ON t.table_name = p.tablename AND p.schemaname = 'public'
WHERE t.table_schema = 'public'
    AND p.tablename IS NULL
ORDER BY t.table_name;
