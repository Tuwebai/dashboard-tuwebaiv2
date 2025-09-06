-- Script para corregir y verificar las tablas de Websy AI
-- Ejecutar en la consola SQL de Supabase

-- 1. Verificar si la tabla projects tiene las columnas necesarias
DO $$
BEGIN
    -- Verificar si existe la columna 'progress' en projects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'progress'
    ) THEN
        ALTER TABLE projects ADD COLUMN progress INTEGER DEFAULT 0;
        RAISE NOTICE 'Columna progress agregada a projects';
    END IF;
    
    -- Verificar si existe la columna 'status' en projects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Columna status agregada a projects';
    END IF;
    
    -- Verificar si existe la columna 'created_by' en projects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE projects ADD COLUMN created_by UUID REFERENCES users(id);
        RAISE NOTICE 'Columna created_by agregada a projects';
    END IF;
END $$;

-- 2. Verificar si la tabla tickets tiene las columnas necesarias
DO $$
BEGIN
    -- Verificar si existe la columna 'priority' en tickets
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE tickets ADD COLUMN priority TEXT DEFAULT 'medium';
        RAISE NOTICE 'Columna priority agregada a tickets';
    END IF;
    
    -- Verificar si existe la columna 'status' en tickets
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE tickets ADD COLUMN status TEXT DEFAULT 'open';
        RAISE NOTICE 'Columna status agregada a tickets';
    END IF;
    
    -- Verificar si existe la columna 'user_id' en tickets
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE tickets ADD COLUMN user_id UUID REFERENCES users(id);
        RAISE NOTICE 'Columna user_id agregada a tickets';
    END IF;
END $$;

-- 3. Verificar y corregir la tabla ai_settings
DO $$
BEGIN
    -- Verificar si la tabla ai_settings existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'ai_settings'
    ) THEN
        CREATE TABLE ai_settings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            settings JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
        RAISE NOTICE 'Tabla ai_settings creada';
    END IF;
END $$;

-- 4. Habilitar RLS en ai_settings si no está habilitado
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas RLS para ai_settings si no existen
DO $$
BEGIN
    -- Política para SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_settings' 
        AND policyname = 'Users can view their own AI settings'
    ) THEN
        CREATE POLICY "Users can view their own AI settings" ON ai_settings
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE 'Política SELECT creada para ai_settings';
    END IF;
    
    -- Política para INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_settings' 
        AND policyname = 'Users can insert their own AI settings'
    ) THEN
        CREATE POLICY "Users can insert their own AI settings" ON ai_settings
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Política INSERT creada para ai_settings';
    END IF;
    
    -- Política para UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_settings' 
        AND policyname = 'Users can update their own AI settings'
    ) THEN
        CREATE POLICY "Users can update their own AI settings" ON ai_settings
            FOR UPDATE USING (auth.uid() = user_id);
        RAISE NOTICE 'Política UPDATE creada para ai_settings';
    END IF;
    
    -- Política para DELETE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_settings' 
        AND policyname = 'Users can delete their own AI settings'
    ) THEN
        CREATE POLICY "Users can delete their own AI settings" ON ai_settings
            FOR DELETE USING (auth.uid() = user_id);
        RAISE NOTICE 'Política DELETE creada para ai_settings';
    END IF;
END $$;

-- 6. Verificar estructura final
SELECT 
    'projects' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('id', 'name', 'status', 'progress', 'created_at', 'updated_at', 'created_by')
ORDER BY column_name;

SELECT 
    'tickets' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name IN ('id', 'title', 'status', 'priority', 'created_at', 'user_id')
ORDER BY column_name;

SELECT 
    'ai_settings' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ai_settings'
ORDER BY column_name;
