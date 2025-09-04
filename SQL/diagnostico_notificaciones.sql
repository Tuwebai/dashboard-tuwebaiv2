-- =====================================================
-- DIAGNÓSTICO COMPLETO DEL SISTEMA DE NOTIFICACIONES
-- =====================================================
-- Ejecutar este script PRIMERO para ver qué existe y qué falta

-- 1. VERIFICAR TABLAS EXISTENTES
SELECT '=== TABLAS EXISTENTES ===' as info;

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%notification%'
ORDER BY table_name;

-- 2. VERIFICAR ESTRUCTURA DE LA TABLA notifications (si existe)
SELECT '=== ESTRUCTURA DE notifications ===' as info;

DO $$
DECLARE
    col_record RECORD;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla notifications EXISTE';
        
        -- Mostrar columnas existentes
        RAISE NOTICE 'Columnas en notifications:';
        FOR col_record IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'notifications' AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  %: % (nullable: %, default: %)', 
                col_record.column_name, col_record.data_type, col_record.is_nullable, col_record.column_default;
        END LOOP;
        
    ELSE
        RAISE NOTICE 'Tabla notifications NO EXISTE';
    END IF;
END $$;

-- 3. VERIFICAR TABLA notification_channels (si existe)
SELECT '=== ESTRUCTURA DE notification_channels ===' as info;

DO $$
DECLARE
    col_record RECORD;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_channels' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla notification_channels EXISTE';
        
        -- Mostrar columnas existentes
        RAISE NOTICE 'Columnas en notification_channels:';
        FOR col_record IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'notification_channels' AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  %: % (nullable: %, default: %)', 
                col_record.column_name, col_record.data_type, col_record.is_nullable, col_record.column_default;
        END LOOP;
        
    ELSE
        RAISE NOTICE 'Tabla notification_channels NO EXISTE';
    END IF;
END $$;

-- 4. VERIFICAR TABLA users (necesaria para referencias)
SELECT '=== ESTRUCTURA DE users ===' as info;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla users EXISTE';
        
        -- Verificar si tiene columna role
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role' AND table_schema = 'public') THEN
            RAISE NOTICE 'Columna role EXISTE en users';
        ELSE
            RAISE NOTICE 'Columna role NO EXISTE en users';
        END IF;
        
    ELSE
        RAISE NOTICE 'Tabla users NO EXISTE';
    END IF;
END $$;

-- 5. VERIFICAR FUNCIONES EXISTENTES
SELECT '=== FUNCIONES EXISTENTES ===' as info;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%'
ORDER BY routine_name;

-- 6. VERIFICAR POLÍTICAS RLS EXISTENTES
SELECT '=== POLÍTICAS RLS EXISTENTES ===' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE '%notification%'
ORDER BY tablename, policyname;

-- 7. VERIFICAR ÍNDICES EXISTENTES
SELECT '=== ÍNDICES EXISTENTES ===' as info;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE '%notification%'
ORDER BY tablename, indexname;

-- 8. VERIFICAR CONSTRAINTS EXISTENTES
SELECT '=== CONSTRAINTS EXISTENTES ===' as info;

SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name LIKE '%notification%'
ORDER BY tc.table_name, tc.constraint_name;

-- 9. RESUMEN DE VERIFICACIÓN
SELECT '=== RESUMEN DE VERIFICACIÓN ===' as info;

DO $$
DECLARE
    notifications_exists boolean := false;
    notification_channels_exists boolean := false;
    users_exists boolean := false;
    users_has_role boolean := false;
    missing_tables text[] := ARRAY[]::text[];
    missing_columns text[] := ARRAY[]::text[];
BEGIN
    -- Verificar tablas críticas
    notifications_exists := EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public');
    notification_channels_exists := EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_channels' AND table_schema = 'public');
    users_exists := EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public');
    
    IF users_exists THEN
        users_has_role := EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role' AND table_schema = 'public');
    END IF;
    
    -- Construir arrays de lo que falta
    IF NOT notifications_exists THEN
        missing_tables := array_append(missing_tables, 'notifications');
    END IF;
    
    IF NOT notification_channels_exists THEN
        missing_tables := array_append(missing_tables, 'notification_channels');
    END IF;
    
    IF NOT users_exists THEN
        missing_tables := array_append(missing_tables, 'users');
    END IF;
    
    IF users_exists AND NOT users_has_role THEN
        missing_columns := array_append(missing_columns, 'users.role');
    END IF;
    
    -- Mostrar resumen
    RAISE NOTICE '=== RESUMEN ===';
    RAISE NOTICE 'Tabla notifications: %', CASE WHEN notifications_exists THEN 'EXISTE' ELSE 'NO EXISTE' END;
    RAISE NOTICE 'Tabla notification_channels: %', CASE WHEN notification_channels_exists THEN 'EXISTE' ELSE 'NO EXISTE' END;
    RAISE NOTICE 'Tabla users: %', CASE WHEN users_exists THEN 'EXISTE' ELSE 'NO EXISTE' END;
    RAISE NOTICE 'Columna users.role: %', CASE WHEN users_has_role THEN 'EXISTE' ELSE 'NO EXISTE' END;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'TABLAS FALTANTES: %', array_to_string(missing_tables, ', ');
    END IF;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE 'COLUMNAS FALTANTES: %', array_to_string(missing_columns, ', ');
    END IF;
    
    IF array_length(missing_tables, 1) = 0 AND array_length(missing_columns, 1) = 0 THEN
        RAISE NOTICE '✅ TODAS LAS DEPENDENCIAS ESTÁN PRESENTES - Puedes ejecutar create_advanced_notification_tables.sql';
    ELSE
        RAISE NOTICE '❌ FALTAN DEPENDENCIAS - Necesitas crear/actualizar tablas antes de continuar';
    END IF;
    
END $$;
