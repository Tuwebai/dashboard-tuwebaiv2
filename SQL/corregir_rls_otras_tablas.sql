-- =====================================================
-- CORREGIR RLS PARA OTRAS TABLAS "UNRESTRICTED"
-- =====================================================
-- Habilitar RLS y crear políticas de seguridad

-- 1. HABILITAR RLS EN LAS TABLAS IDENTIFICADAS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_with_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions_with_project_info ENABLE ROW LEVEL SECURITY;

-- 2. CREAR POLÍTICAS PARA push_subscriptions
-- Cada usuario solo puede ver/editar sus propias suscripciones push
CREATE POLICY "push_subscriptions_own" ON public.push_subscriptions
    FOR ALL USING (user_id = auth.uid());

-- 3. CREAR POLÍTICAS PARA users_with_stats
-- Los usuarios pueden ver estadísticas de todos los usuarios (para admin)
-- Pero solo pueden editar sus propias estadísticas
CREATE POLICY "users_with_stats_read_all" ON public.users_with_stats
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users_with_stats_update_own" ON public.users_with_stats
    FOR UPDATE USING (id = auth.uid());

-- 4. CREAR POLÍTICAS PARA workflow_executions_with_project_info
-- Los usuarios pueden ver ejecuciones de workflows de proyectos a los que tienen acceso
-- Solo pueden editar ejecuciones de sus propios proyectos
CREATE POLICY "workflow_executions_read_accessible" ON public.workflow_executions_with_project_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = workflow_executions_with_project_info.project_id
            AND (
                projects.user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.project_members 
                    WHERE project_members.project_id = projects.id 
                    AND project_members.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "workflow_executions_update_own" ON public.workflow_executions_with_project_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = workflow_executions_with_project_info.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- 5. VERIFICAR QUE LAS POLÍTICAS SE CREARON CORRECTAMENTE
SELECT 'POLÍTICAS CREADAS' as info, 
       tablename, 
       policyname, 
       cmd, 
       permissive
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('push_subscriptions', 'users_with_stats', 'workflow_executions_with_project_info')
ORDER BY tablename, policyname;

-- 6. VERIFICAR ESTADO RLS
SELECT 'ESTADO RLS' as info,
       schemaname,
       tablename,
       rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('push_subscriptions', 'users_with_stats', 'workflow_executions_with_project_info')
ORDER BY tablename;

-- 7. VERIFICAR QUE YA NO HAY TABLAS "UNRESTRICTED"
SELECT 'VERIFICACIÓN FINAL' as info,
       tablename,
       CASE 
           WHEN rowsecurity THEN '✅ RLS HABILITADO'
           ELSE '❌ RLS DESHABILITADO'
       END as estado_rls
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('push_subscriptions', 'users_with_stats', 'workflow_executions_with_project_info')
ORDER BY tablename;
