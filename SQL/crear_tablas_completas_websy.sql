-- =====================================================
-- SCRIPT IDEMPOTENTE PARA CREAR TODAS LAS TABLAS WEBSY
-- =====================================================
-- Este script crea todas las tablas necesarias de forma segura
-- Se puede ejecutar múltiples veces sin errores
-- Basado en la estructura real de BASEDEDATOSCOMPLETA.sql

-- 1. CREAR TABLAS DE WEBSY AI (si no existen)
-- =====================================================

-- Tabla de perfiles de usuario de Websy
CREATE TABLE IF NOT EXISTS websy_user_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE,
    work_patterns text[] DEFAULT '{}'::text[],
    preferred_communication_style text DEFAULT 'balanced'::text,
    common_tasks text[] DEFAULT '{}'::text[],
    expertise_areas text[] DEFAULT '{}'::text[],
    project_contexts text[] DEFAULT '{}'::text[],
    learning_preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT websy_user_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT websy_user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Tabla de memorias de conversación
CREATE TABLE IF NOT EXISTS websy_conversation_memories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    conversation_id text NOT NULL,
    context_summary text NOT NULL,
    key_topics text[] DEFAULT '{}'::text[],
    user_preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT websy_conversation_memories_pkey PRIMARY KEY (id),
    CONSTRAINT websy_conversation_memories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Tabla de base de conocimiento
CREATE TABLE IF NOT EXISTS websy_knowledge_base (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    title text NOT NULL,
    content text NOT NULL,
    category text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    project_id uuid,
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT websy_knowledge_base_pkey PRIMARY KEY (id),
    CONSTRAINT websy_knowledge_base_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
    CONSTRAINT websy_knowledge_base_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- 2. CREAR TABLAS DE PROYECTOS Y TAREAS (si no existen)
-- =====================================================

-- Tabla de fases de proyecto
CREATE TABLE IF NOT EXISTS project_phases (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    name character varying NOT NULL,
    description text,
    phase_order integer NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    completion_percentage integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT project_phases_pkey PRIMARY KEY (id),
    CONSTRAINT project_phases_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
    CONSTRAINT project_phases_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Tabla de tareas
CREATE TABLE IF NOT EXISTS tasks (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title character varying NOT NULL,
    description text,
    status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'in-progress'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
    priority character varying DEFAULT 'medium'::character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying]::text[])),
    assignee character varying NOT NULL,
    assignee_name character varying NOT NULL,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    project_id uuid NOT NULL,
    phase_key character varying,
    estimated_hours integer DEFAULT 1,
    required_skills text[] DEFAULT '{}'::text[],
    phase_id uuid,
    assigned_to uuid,
    created_by uuid,
    actual_hours numeric DEFAULT 0,
    completion_percentage integer DEFAULT 0,
    tags text[],
    dependencies text[],
    CONSTRAINT tasks_pkey PRIMARY KEY (id),
    CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
    CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id),
    CONSTRAINT tasks_phase_id_fkey FOREIGN KEY (phase_id) REFERENCES public.project_phases(id)
);

-- Tabla de métricas de proyecto
CREATE TABLE IF NOT EXISTS project_metrics (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    metric_date date NOT NULL,
    completion_percentage integer DEFAULT 0,
    velocity_points integer DEFAULT 0,
    bug_count integer DEFAULT 0,
    task_count integer DEFAULT 0,
    completed_tasks integer DEFAULT 0,
    overdue_tasks integer DEFAULT 0,
    total_hours_estimated numeric DEFAULT 0,
    total_hours_actual numeric DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT project_metrics_pkey PRIMARY KEY (id),
    CONSTRAINT project_metrics_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- Tabla de log de actividades
CREATE TABLE IF NOT EXISTS project_activity_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid,
    task_id uuid,
    phase_id uuid,
    user_id uuid NOT NULL,
    action character varying NOT NULL,
    description text,
    old_values jsonb,
    new_values jsonb,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT project_activity_log_pkey PRIMARY KEY (id),
    CONSTRAINT project_activity_log_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
    CONSTRAINT project_activity_log_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
    CONSTRAINT project_activity_log_phase_id_fkey FOREIGN KEY (phase_id) REFERENCES public.project_phases(id),
    CONSTRAINT project_activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Tabla de archivos adjuntos
CREATE TABLE IF NOT EXISTS project_attachments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid,
    task_id uuid,
    phase_id uuid,
    file_name character varying NOT NULL,
    file_path character varying NOT NULL,
    file_size bigint,
    mime_type character varying,
    uploaded_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT project_attachments_pkey PRIMARY KEY (id),
    CONSTRAINT project_attachments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
    CONSTRAINT project_attachments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
    CONSTRAINT project_attachments_phase_id_fkey FOREIGN KEY (phase_id) REFERENCES public.project_phases(id),
    CONSTRAINT project_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id)
);

-- Tabla de comentarios de tareas
CREATE TABLE IF NOT EXISTS task_comments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    comment text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT task_comments_pkey PRIMARY KEY (id),
    CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
    CONSTRAINT task_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Tabla de dependencias entre tareas
CREATE TABLE IF NOT EXISTS task_dependencies (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    depends_on_task_id uuid NOT NULL,
    dependency_type character varying DEFAULT 'finish_to_start'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT task_dependencies_pkey PRIMARY KEY (id),
    CONSTRAINT task_dependencies_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
    CONSTRAINT task_dependencies_depends_on_task_id_fkey FOREIGN KEY (depends_on_task_id) REFERENCES public.tasks(id)
);

-- 3. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para websy_user_profiles
CREATE INDEX IF NOT EXISTS idx_websy_user_profiles_user_id ON websy_user_profiles(user_id);

-- Índices para websy_conversation_memories
CREATE INDEX IF NOT EXISTS idx_websy_conversation_memories_user_id ON websy_conversation_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_websy_conversation_memories_conversation_id ON websy_conversation_memories(conversation_id);
CREATE INDEX IF NOT EXISTS idx_websy_conversation_memories_created_at ON websy_conversation_memories(created_at);

-- Índices para websy_knowledge_base
CREATE INDEX IF NOT EXISTS idx_websy_knowledge_base_user_id ON websy_knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_websy_knowledge_base_category ON websy_knowledge_base(category);

-- Índices para project_phases
CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_status ON project_phases(status);

-- Índices para tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_phase_id ON tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Índices para project_metrics
CREATE INDEX IF NOT EXISTS idx_project_metrics_project_id ON project_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_project_metrics_created_at ON project_metrics(created_at);

-- Índices para project_activity_log
CREATE INDEX IF NOT EXISTS idx_project_activity_log_project_id ON project_activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_user_id ON project_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_created_at ON project_activity_log(created_at);

-- Índices para project_attachments
CREATE INDEX IF NOT EXISTS idx_project_attachments_project_id ON project_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_attachments_task_id ON project_attachments(task_id);

-- Índices para task_comments
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);

-- Índices para task_dependencies
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- 4. CREAR TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para websy_user_profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_websy_user_profiles_updated_at') THEN
        CREATE TRIGGER update_websy_user_profiles_updated_at
            BEFORE UPDATE ON websy_user_profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Triggers para websy_conversation_memories
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_websy_conversation_memories_updated_at') THEN
        CREATE TRIGGER update_websy_conversation_memories_updated_at
            BEFORE UPDATE ON websy_conversation_memories
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Triggers para websy_knowledge_base
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_websy_knowledge_base_updated_at') THEN
        CREATE TRIGGER update_websy_knowledge_base_updated_at
            BEFORE UPDATE ON websy_knowledge_base
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Triggers para project_phases
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_project_phases_updated_at') THEN
        CREATE TRIGGER update_project_phases_updated_at
            BEFORE UPDATE ON project_phases
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Triggers para tasks
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
        CREATE TRIGGER update_tasks_updated_at
            BEFORE UPDATE ON tasks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Triggers para task_comments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_task_comments_updated_at') THEN
        CREATE TRIGGER update_task_comments_updated_at
            BEFORE UPDATE ON task_comments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 5. CREAR POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE websy_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE websy_conversation_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE websy_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Políticas para websy_user_profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile' AND tablename = 'websy_user_profiles') THEN
        CREATE POLICY "Users can view own profile" ON websy_user_profiles
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile' AND tablename = 'websy_user_profiles') THEN
        CREATE POLICY "Users can insert own profile" ON websy_user_profiles
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'websy_user_profiles') THEN
        CREATE POLICY "Users can update own profile" ON websy_user_profiles
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Políticas para websy_conversation_memories
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own memories' AND tablename = 'websy_conversation_memories') THEN
        CREATE POLICY "Users can view own memories" ON websy_conversation_memories
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own memories' AND tablename = 'websy_conversation_memories') THEN
        CREATE POLICY "Users can insert own memories" ON websy_conversation_memories
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own memories' AND tablename = 'websy_conversation_memories') THEN
        CREATE POLICY "Users can update own memories" ON websy_conversation_memories
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Políticas para websy_knowledge_base
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own knowledge' AND tablename = 'websy_knowledge_base') THEN
        CREATE POLICY "Users can view own knowledge" ON websy_knowledge_base
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own knowledge' AND tablename = 'websy_knowledge_base') THEN
        CREATE POLICY "Users can insert own knowledge" ON websy_knowledge_base
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own knowledge' AND tablename = 'websy_knowledge_base') THEN
        CREATE POLICY "Users can update own knowledge" ON websy_knowledge_base
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Políticas para project_phases
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view project phases' AND tablename = 'project_phases') THEN
        CREATE POLICY "Users can view project phases" ON project_phases
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert project phases' AND tablename = 'project_phases') THEN
        CREATE POLICY "Users can insert project phases" ON project_phases
            FOR INSERT WITH CHECK (auth.uid() = created_by);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update project phases' AND tablename = 'project_phases') THEN
        CREATE POLICY "Users can update project phases" ON project_phases
            FOR UPDATE USING (auth.uid() = created_by);
    END IF;
END $$;

-- Políticas para tasks
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view tasks' AND tablename = 'tasks') THEN
        CREATE POLICY "Users can view tasks" ON tasks
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert tasks' AND tablename = 'tasks') THEN
        CREATE POLICY "Users can insert tasks" ON tasks
            FOR INSERT WITH CHECK (auth.uid() = created_by);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update tasks' AND tablename = 'tasks') THEN
        CREATE POLICY "Users can update tasks" ON tasks
            FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to);
    END IF;
END $$;

-- Políticas para project_metrics
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view project metrics' AND tablename = 'project_metrics') THEN
        CREATE POLICY "Users can view project metrics" ON project_metrics
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert project metrics' AND tablename = 'project_metrics') THEN
        CREATE POLICY "Users can insert project metrics" ON project_metrics
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Políticas para project_activity_log
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view activity log' AND tablename = 'project_activity_log') THEN
        CREATE POLICY "Users can view activity log" ON project_activity_log
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert activity log' AND tablename = 'project_activity_log') THEN
        CREATE POLICY "Users can insert activity log" ON project_activity_log
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Políticas para project_attachments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view attachments' AND tablename = 'project_attachments') THEN
        CREATE POLICY "Users can view attachments" ON project_attachments
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert attachments' AND tablename = 'project_attachments') THEN
        CREATE POLICY "Users can insert attachments" ON project_attachments
            FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
    END IF;
END $$;

-- Políticas para task_comments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view task comments' AND tablename = 'task_comments') THEN
        CREATE POLICY "Users can view task comments" ON task_comments
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert task comments' AND tablename = 'task_comments') THEN
        CREATE POLICY "Users can insert task comments" ON task_comments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update task comments' AND tablename = 'task_comments') THEN
        CREATE POLICY "Users can update task comments" ON task_comments
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Políticas para task_dependencies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view task dependencies' AND tablename = 'task_dependencies') THEN
        CREATE POLICY "Users can view task dependencies" ON task_dependencies
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert task dependencies' AND tablename = 'task_dependencies') THEN
        CREATE POLICY "Users can insert task dependencies" ON task_dependencies
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 6. CREAR VISTAS ÚTILES
-- =====================================================

-- Vista de resumen de proyectos con tareas
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.status,
    p.created_at,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COUNT(DISTINCT ph.id) as total_phases,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT t.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END)::DECIMAL / COUNT(DISTINCT t.id)) * 100
            ELSE 0 
        END, 2
    ) as completion_percentage
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN project_phases ph ON p.id = ph.project_id
GROUP BY p.id, p.name, p.description, p.status, p.created_at;

-- Vista de detalles de tareas
CREATE OR REPLACE VIEW task_details AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.assignee_name,
    t.due_date,
    t.completion_percentage,
    p.name as project_name,
    ph.name as phase_name,
    t.created_at,
    t.updated_at
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN project_phases ph ON t.phase_id = ph.id;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'websy_user_profiles',
    'websy_conversation_memories', 
    'websy_knowledge_base',
    'project_phases',
    'tasks',
    'project_metrics',
    'project_activity_log',
    'project_attachments',
    'task_comments',
    'task_dependencies'
)
ORDER BY tablename;