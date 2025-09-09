import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tablas que necesitamos verificar
const requiredTables = [
  'websy_user_profiles',
  'websy_conversation_memories',
  'websy_knowledge_base'
];

async function checkTable(tableName) {
  try {
    console.log(`🔍 Verificando tabla: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
      return { exists: false, error: error.message };
    } else {
      console.log(`✅ ${tableName}: Existe (${data?.length || 0} registros)`);
      return { exists: true, count: data?.length || 0 };
    }
  } catch (err) {
    console.log(`❌ ${tableName}: ${err.message}`);
    return { exists: false, error: err.message };
  }
}

async function createMissingTables() {
  console.log('\n🔧 Creando tablas faltantes...\n');
  
  // SQL para crear las tablas
  const createTablesSQL = `
    -- Crear tabla websy_user_profiles
    CREATE TABLE IF NOT EXISTS websy_user_profiles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      work_patterns TEXT[] DEFAULT '{}',
      preferences JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Crear tabla websy_conversation_memories
    CREATE TABLE IF NOT EXISTS websy_conversation_memories (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      conversation_id TEXT NOT NULL,
      context_summary TEXT,
      key_topics TEXT[] DEFAULT '{}',
      user_preferences JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Crear tabla websy_knowledge_base
    CREATE TABLE IF NOT EXISTS websy_knowledge_base (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      tags TEXT[] DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Crear índices
    CREATE INDEX IF NOT EXISTS idx_websy_user_profiles_user_id ON websy_user_profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_websy_conversation_memories_user_id ON websy_conversation_memories(user_id);
    CREATE INDEX IF NOT EXISTS idx_websy_conversation_memories_conversation_id ON websy_conversation_memories(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_websy_knowledge_base_user_id ON websy_knowledge_base(user_id);

    -- Habilitar RLS
    ALTER TABLE websy_user_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE websy_conversation_memories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE websy_knowledge_base ENABLE ROW LEVEL SECURITY;

    -- Crear políticas RLS
    CREATE POLICY IF NOT EXISTS "Users can view own profile" ON websy_user_profiles
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS "Users can update own profile" ON websy_user_profiles
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON websy_user_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS "Users can view own memories" ON websy_conversation_memories
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS "Users can insert own memories" ON websy_conversation_memories
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS "Users can update own memories" ON websy_conversation_memories
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS "Users can view own knowledge" ON websy_knowledge_base
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS "Users can insert own knowledge" ON websy_knowledge_base
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS "Users can update own knowledge" ON websy_knowledge_base
      FOR UPDATE USING (auth.uid() = user_id);
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    
    if (error) {
      console.log('❌ Error creando tablas:', error.message);
      console.log('\n📋 SQL para ejecutar manualmente en Supabase:');
      console.log(createTablesSQL);
    } else {
      console.log('✅ Tablas creadas exitosamente');
    }
  } catch (err) {
    console.log('❌ Error ejecutando SQL:', err.message);
    console.log('\n📋 SQL para ejecutar manualmente en Supabase:');
    console.log(createTablesSQL);
  }
}

async function main() {
  console.log('🔍 Verificando tablas de Supabase...\n');
  
  const results = [];
  for (const table of requiredTables) {
    const result = await checkTable(table);
    results.push({ table, ...result });
  }
  
  const missingTables = results.filter(r => !r.exists);
  
  if (missingTables.length > 0) {
    console.log(`\n❌ Faltan ${missingTables.length} tablas:`);
    missingTables.forEach(({ table, error }) => {
      console.log(`   - ${table}: ${error}`);
    });
    
    await createMissingTables();
  } else {
    console.log('\n✅ Todas las tablas existen correctamente');
  }
}

main().catch(console.error);
