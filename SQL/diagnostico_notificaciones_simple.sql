-- =====================================================
-- DIAGNÓSTICO SIMPLE DEL SISTEMA DE NOTIFICACIONES
-- =====================================================
-- Este script usa SELECT para mostrar resultados reales en Supabase

-- 1. VERIFICAR TABLAS EXISTENTES
SELECT 'TABLAS EXISTENTES' as seccion, 
       table_name, 
       table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%notification%'
ORDER BY table_name;

-- 2. VERIFICAR ESTRUCTURA DE LA TABLA notifications
SELECT 'ESTRUCTURA notifications' as seccion,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR TABLA notification_channels
SELECT 'ESTRUCTURA notification_channels' as seccion,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'notification_channels' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICAR TABLA users
SELECT 'ESTRUCTURA users' as seccion,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. VERIFICAR FUNCIONES EXISTENTES
SELECT 'FUNCIONES' as seccion,
       routine_name,
       routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%'
ORDER BY routine_name;

-- 6. VERIFICAR POLÍTICAS RLS
SELECT 'POLÍTICAS RLS' as seccion,
       tablename,
       policyname,
       cmd,
       permissive
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE '%notification%'
ORDER BY tablename, policyname;

-- 7. VERIFICAR ÍNDICES
SELECT 'ÍNDICES' as seccion,
       tablename,
       indexname,
       indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE '%notification%'
ORDER BY tablename, indexname;

-- 8. RESUMEN FINAL - VERIFICAR DEPENDENCIAS CRÍTICAS
WITH dependencias AS (
    SELECT 
        'notifications' as tabla,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') as existe
    UNION ALL
    SELECT 
        'notification_channels' as tabla,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_channels' AND table_schema = 'public') as existe
    UNION ALL
    SELECT 
        'users' as tabla,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') as existe
    UNION ALL
    SELECT 
        'users.role' as tabla,
        EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'role' 
            AND table_schema = 'public'
        ) as existe
)
SELECT 'RESUMEN DEPENDENCIAS' as seccion,
       tabla,
       CASE WHEN existe THEN '✅ EXISTE' ELSE '❌ NO EXISTE' END as estado
FROM dependencias
ORDER BY tabla;

-- 9. VERIFICAR SI SE PUEDE EJECUTAR EL SCRIPT PRINCIPAL
SELECT 
    'ESTADO FINAL' as seccion,
    CASE 
        WHEN 
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public')
            AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_channels' AND table_schema = 'public')
            AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')
            AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role' AND table_schema = 'public')
        THEN '✅ PUEDES EJECUTAR create_advanced_notification_tables.sql'
        ELSE '❌ FALTAN DEPENDENCIAS - Necesitas crear/actualizar tablas primero'
    END as resultado;
