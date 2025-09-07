-- Script completo para consultar toda la estructura de la base de datos
-- Ejecutar en el SQL Editor de Supabase

-- ========================================
-- 1. TODAS LAS TABLAS CON SUS COLUMNAS
-- ========================================
SELECT 'ESTRUCTURA COMPLETA DE LA BASE DE DATOS' as seccion;

SELECT 
    t.table_name as TABLA,
    c.column_name as COLUMNA,
    c.data_type as TIPO_DATO,
    c.character_maximum_length as LONGITUD_MAX,
    c.is_nullable as PERMITE_NULL,
    c.column_default as VALOR_DEFAULT,
    c.ordinal_position as ORDEN
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND c.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- ========================================
-- 3. POLÍTICAS RLS
-- ========================================
SELECT 'POLÍTICAS RLS' as seccion;
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 4. ÍNDICES
-- ========================================
SELECT 'ÍNDICES' as seccion;
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ========================================
-- 5. FUNCIONES
-- ========================================
SELECT 'FUNCIONES' as seccion;
SELECT 
    proname as function_name,
    proargnames as parameters
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;
