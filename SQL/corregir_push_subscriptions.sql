-- =====================================================
-- CORREGIR RLS SOLO EN push_subscriptions
-- =====================================================

-- 1. HABILITAR RLS EN push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. CREAR POLÍTICA PARA push_subscriptions
-- Cada usuario solo puede ver/editar sus propias suscripciones push
CREATE POLICY "push_subscriptions_own" ON public.push_subscriptions
    FOR ALL USING (user_id = auth.uid());

-- 3. VERIFICAR QUE SE CREÓ LA POLÍTICA
SELECT 'POLÍTICA CREADA' as info, 
       tablename, 
       policyname
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'push_subscriptions';

-- 4. VERIFICAR ESTADO RLS
SELECT 'ESTADO RLS' as info,
       tablename,
       CASE 
           WHEN rowsecurity THEN '✅ RLS HABILITADO'
           ELSE '❌ RLS DESHABILITADO'
       END as estado_rls
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'push_subscriptions';
