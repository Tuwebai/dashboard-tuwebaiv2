-- Script idempotente para corregir errores de Supabase
-- Se puede ejecutar múltiples veces sin errores
-- No usa datos simulados, solo estructura

-- ========================================
-- 1. CREAR TABLA websy_memory SI NO EXISTE
-- ========================================
CREATE TABLE IF NOT EXISTS websy_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversation_id TEXT NOT NULL,
    context_summary TEXT NOT NULL,
    key_topics TEXT[] DEFAULT '{}',
    user_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear índices para websy_memory
CREATE INDEX IF NOT EXISTS idx_websy_memory_user_id ON websy_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_websy_memory_conversation_id ON websy_memory(conversation_id);

-- ========================================
-- 2. CORREGIR TABLA users - AGREGAR COLUMNAS FALTANTES
-- ========================================
-- Agregar columna role si no existe (ya existe según la estructura)
-- Agregar columna avatar_url si no existe (ya existe según la estructura)

-- ========================================
-- 3. CORREGIR TABLA projects - AGREGAR COLUMNAS FALTANTES
-- ========================================
-- Agregar columna progress si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'progress') THEN
        ALTER TABLE projects ADD COLUMN progress INTEGER DEFAULT 0;
    END IF;
END $$;

-- Agregar columna priority si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'priority') THEN
        ALTER TABLE projects ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
    END IF;
END $$;

-- Agregar columna start_date si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'start_date') THEN
        ALTER TABLE projects ADD COLUMN start_date TIMESTAMP WITHOUT TIME ZONE;
    END IF;
END $$;

-- Agregar columna end_date si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'end_date') THEN
        ALTER TABLE projects ADD COLUMN end_date TIMESTAMP WITHOUT TIME ZONE;
    END IF;
END $$;

-- Agregar columna completion_percentage si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'completion_percentage') THEN
        ALTER TABLE projects ADD COLUMN completion_percentage INTEGER DEFAULT 0;
    END IF;
END $$;

-- ========================================
-- 4. CORREGIR TABLA tasks - UNIFICAR CON project_tasks
-- ========================================
-- Agregar columnas faltantes a tasks
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'project_id') THEN
        ALTER TABLE tasks ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'phase_key') THEN
        ALTER TABLE tasks ADD COLUMN phase_key VARCHAR(100);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'estimated_hours') THEN
        ALTER TABLE tasks ADD COLUMN estimated_hours INTEGER DEFAULT 1;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'required_skills') THEN
        ALTER TABLE tasks ADD COLUMN required_skills TEXT[] DEFAULT '{}';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'phase_id') THEN
        ALTER TABLE tasks ADD COLUMN phase_id UUID;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
        ALTER TABLE tasks ADD COLUMN assigned_to UUID REFERENCES users(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'created_by') THEN
        ALTER TABLE tasks ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'actual_hours') THEN
        ALTER TABLE tasks ADD COLUMN actual_hours NUMERIC DEFAULT 0;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'completion_percentage') THEN
        ALTER TABLE tasks ADD COLUMN completion_percentage INTEGER DEFAULT 0;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'tags') THEN
        ALTER TABLE tasks ADD COLUMN tags TEXT[];
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'dependencies') THEN
        ALTER TABLE tasks ADD COLUMN dependencies TEXT[];
    END IF;
END $$;

-- ========================================
-- 5. CREAR TABLA chat_history SI NO EXISTE (YA EXISTE SEGÚN LA ESTRUCTURA)
-- ========================================
-- La tabla ya existe, solo verificar que tenga las columnas correctas

-- ========================================
-- 6. CREAR TABLA notifications SI NO EXISTE (YA EXISTE SEGÚN LA ESTRUCTURA)
-- ========================================
-- La tabla ya existe, solo verificar que tenga las columnas correctas

-- ========================================
-- 7. CREAR TABLA user_preferences SI NO EXISTE (YA EXISTE SEGÚN LA ESTRUCTURA)
-- ========================================
-- La tabla ya existe, solo verificar que tenga las columnas correctas

-- ========================================
-- 8. CREAR TABLA automation_tasks SI NO EXISTE (YA EXISTE SEGÚN LA ESTRUCTURA)
-- ========================================
-- La tabla ya existe, solo verificar que tenga las columnas correctas

-- ========================================
-- 9. CREAR POLÍTICAS RLS BÁSICAS
-- ========================================

-- Política para users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own data') THEN
        CREATE POLICY "Users can view own data" ON users
            FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own data') THEN
        CREATE POLICY "Users can update own data" ON users
            FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Política para projects
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can view own projects') THEN
        CREATE POLICY "Users can view own projects" ON projects
            FOR SELECT USING (auth.uid() = created_by);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can insert own projects') THEN
        CREATE POLICY "Users can insert own projects" ON projects
            FOR INSERT WITH CHECK (auth.uid() = created_by);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can update own projects') THEN
        CREATE POLICY "Users can update own projects" ON projects
            FOR UPDATE USING (auth.uid() = created_by);
    END IF;
END $$;

-- Política para tasks
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can view project tasks') THEN
        CREATE POLICY "Users can view project tasks" ON tasks
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM projects 
                    WHERE projects.id = tasks.project_id 
                    AND projects.created_by = auth.uid()
                )
            );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can insert project tasks') THEN
        CREATE POLICY "Users can insert project tasks" ON tasks
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM projects 
                    WHERE projects.id = tasks.project_id 
                    AND projects.created_by = auth.uid()
                )
            );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can update project tasks') THEN
        CREATE POLICY "Users can update project tasks" ON tasks
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM projects 
                    WHERE projects.id = tasks.project_id 
                    AND projects.created_by = auth.uid()
                )
            );
    END IF;
END $$;

-- Política para websy_memory
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'websy_memory' AND policyname = 'Users can manage own memory') THEN
        CREATE POLICY "Users can manage own memory" ON websy_memory
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Política para chat_history
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_history' AND policyname = 'Users can manage own chat') THEN
        CREATE POLICY "Users can manage own chat" ON chat_history
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Política para notifications
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can manage own notifications') THEN
        CREATE POLICY "Users can manage own notifications" ON notifications
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ========================================
-- 10. HABILITAR RLS EN TABLAS PRINCIPALES
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE websy_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 11. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- ========================================

-- Índices para projects
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(is_active);

-- Índices para tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Índices para chat_history
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- ========================================
-- 12. CREAR FUNCIONES ÚTILES
-- ========================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_websy_memory_updated_at ON websy_memory;
CREATE TRIGGER update_websy_memory_updated_at
    BEFORE UPDATE ON websy_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 13. COMENTARIOS FINALES
-- ========================================
COMMENT ON TABLE websy_memory IS 'Memoria de conversaciones de Websy AI';
COMMENT ON TABLE projects IS 'Proyectos de usuarios';
COMMENT ON TABLE tasks IS 'Tareas de proyectos';
COMMENT ON TABLE chat_history IS 'Historial de chat con IA';
COMMENT ON TABLE notifications IS 'Notificaciones de usuarios';

-- ========================================
-- SCRIPT COMPLETADO
-- ========================================
SELECT 'Script de corrección de Supabase ejecutado exitosamente' as resultado;
