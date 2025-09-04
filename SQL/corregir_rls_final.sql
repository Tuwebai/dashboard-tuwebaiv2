-- =====================================================
-- CORREGIR RLS FINAL - SOLO TABLAS REALES
-- =====================================================

-- 1. HABILITAR RLS EN push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. HABILITAR RLS EN workflow_executions_with_project_info
ALTER TABLE public.workflow_executions_with_project_info ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICAS PARA push_subscriptions
CREATE POLICY "push_subscriptions_own" ON public.push_subscriptions
    FOR ALL USING (user_id = auth.uid());

-- 4. CREAR POLÍTICAS PARA workflow_executions_with_project_info
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

-- 5. VERIFICAR QUE SE CREARON LAS POLÍTICAS
SELECT 'POLÍTICAS CREADAS' as info, 
       tablename, 
       policyname
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('push_subscriptions', 'workflow_executions_with_project_info')
ORDER BY tablename, policyname;
