-- =====================================================
-- CONFIGURACIÓN DE POLÍTICAS RLS PARA WEBSY AI
-- =====================================================
-- Ejecutar este SQL en el editor SQL de Supabase

-- Habilitar RLS en todas las tablas
ALTER TABLE websy_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE websy_conversation_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE websy_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own profile" ON websy_user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON websy_user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON websy_user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON websy_user_profiles;

DROP POLICY IF EXISTS "Users can view own memories" ON websy_conversation_memories;
DROP POLICY IF EXISTS "Users can insert own memories" ON websy_conversation_memories;
DROP POLICY IF EXISTS "Users can update own memories" ON websy_conversation_memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON websy_conversation_memories;

DROP POLICY IF EXISTS "Users can view own knowledge" ON websy_knowledge_base;
DROP POLICY IF EXISTS "Users can insert own knowledge" ON websy_knowledge_base;
DROP POLICY IF EXISTS "Users can update own knowledge" ON websy_knowledge_base;
DROP POLICY IF EXISTS "Users can delete own knowledge" ON websy_knowledge_base;

-- =====================================================
-- POLÍTICAS PARA websy_user_profiles
-- =====================================================

CREATE POLICY "Users can view own profile" ON websy_user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON websy_user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON websy_user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON websy_user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA websy_conversation_memories
-- =====================================================

CREATE POLICY "Users can view own memories" ON websy_conversation_memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON websy_conversation_memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" ON websy_conversation_memories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" ON websy_conversation_memories
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA websy_knowledge_base
-- =====================================================

CREATE POLICY "Users can view own knowledge" ON websy_knowledge_base
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge" ON websy_knowledge_base
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge" ON websy_knowledge_base
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge" ON websy_knowledge_base
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las políticas se crearon correctamente
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
WHERE tablename IN ('websy_user_profiles', 'websy_conversation_memories', 'websy_knowledge_base')
ORDER BY tablename, policyname;
