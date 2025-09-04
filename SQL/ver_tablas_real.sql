-- VER EXACTAMENTE QUÉ TABLAS Y COLUMNAS EXISTEN

-- 1. TODAS LAS TABLAS QUE CONTIENEN "notification"
SELECT 'TABLAS CON "notification"' as info, table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%notification%';

-- 2. ESTRUCTURA COMPLETA DE notifications
SELECT 'COLUMNAS DE notifications' as info, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. ESTRUCTURA COMPLETA DE notification_channels  
SELECT 'COLUMNAS DE notification_channels' as info, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notification_channels' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. ESTRUCTURA COMPLETA DE users
SELECT 'COLUMNAS DE users' as info, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. VER TODAS LAS TABLAS DE PUBLIC
SELECT 'TODAS LAS TABLAS DE PUBLIC' as info, table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
