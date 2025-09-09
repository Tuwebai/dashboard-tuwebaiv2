import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixPolicies() {
  console.log('🔧 Corrigiendo políticas RLS...\n');
  
  const policies = [
    // Políticas para websy_user_profiles
    {
      table: 'websy_user_profiles',
      name: 'Users can view own profile',
      policy: 'FOR SELECT USING (auth.uid() = user_id)'
    },
    {
      table: 'websy_user_profiles', 
      name: 'Users can update own profile',
      policy: 'FOR UPDATE USING (auth.uid() = user_id)'
    },
    {
      table: 'websy_user_profiles',
      name: 'Users can insert own profile', 
      policy: 'FOR INSERT WITH CHECK (auth.uid() = user_id)'
    },
    {
      table: 'websy_user_profiles',
      name: 'Users can delete own profile',
      policy: 'FOR DELETE USING (auth.uid() = user_id)'
    },
    
    // Políticas para websy_conversation_memories
    {
      table: 'websy_conversation_memories',
      name: 'Users can view own memories',
      policy: 'FOR SELECT USING (auth.uid() = user_id)'
    },
    {
      table: 'websy_conversation_memories',
      name: 'Users can insert own memories',
      policy: 'FOR INSERT WITH CHECK (auth.uid() = user_id)'
    },
    {
      table: 'websy_conversation_memories',
      name: 'Users can update own memories',
      policy: 'FOR UPDATE USING (auth.uid() = user_id)'
    },
    {
      table: 'websy_conversation_memories',
      name: 'Users can delete own memories',
      policy: 'FOR DELETE USING (auth.uid() = user_id)'
    },
    
    // Políticas para websy_knowledge_base
    {
      table: 'websy_knowledge_base',
      name: 'Users can view own knowledge',
      policy: 'FOR SELECT USING (auth.uid() = user_id)'
    },
    {
      table: 'websy_knowledge_base',
      name: 'Users can insert own knowledge',
      policy: 'FOR INSERT WITH CHECK (auth.uid() = user_id)'
    },
    {
      table: 'websy_knowledge_base',
      name: 'Users can update own knowledge',
      policy: 'FOR UPDATE USING (auth.uid() = user_id)'
    },
    {
      table: 'websy_knowledge_base',
      name: 'Users can delete own knowledge',
      policy: 'FOR DELETE USING (auth.uid() = user_id)'
    }
  ];

  for (const policy of policies) {
    try {
      console.log(`🔧 Creando política: ${policy.name} en ${policy.table}`);
      
      const { error } = await supabase.rpc('create_policy', {
        table_name: policy.table,
        policy_name: policy.name,
        policy_definition: policy.policy
      });
      
      if (error) {
        console.log(`⚠️  ${policy.name}: ${error.message}`);
      } else {
        console.log(`✅ ${policy.name}: Creada exitosamente`);
      }
    } catch (err) {
      console.log(`❌ ${policy.name}: ${err.message}`);
    }
  }
}

async function testAccess() {
  console.log('\n🧪 Probando acceso a las tablas...\n');
  
  const tables = ['websy_user_profiles', 'websy_conversation_memories', 'websy_knowledge_base'];
  
  for (const table of tables) {
    try {
      console.log(`🔍 Probando acceso a ${table}...`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Acceso exitoso (${data?.length || 0} registros)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

async function main() {
  await fixPolicies();
  await testAccess();
  
  console.log('\n📋 Si las políticas no se crearon, ejecuta este SQL en Supabase:');
  console.log(`
-- Habilitar RLS
ALTER TABLE websy_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE websy_conversation_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE websy_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Crear políticas para websy_user_profiles
CREATE POLICY "Users can view own profile" ON websy_user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON websy_user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON websy_user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON websy_user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Crear políticas para websy_conversation_memories
CREATE POLICY "Users can view own memories" ON websy_conversation_memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON websy_conversation_memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" ON websy_conversation_memories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" ON websy_conversation_memories
  FOR DELETE USING (auth.uid() = user_id);

-- Crear políticas para websy_knowledge_base
CREATE POLICY "Users can view own knowledge" ON websy_knowledge_base
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge" ON websy_knowledge_base
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge" ON websy_knowledge_base
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge" ON websy_knowledge_base
  FOR DELETE USING (auth.uid() = user_id);
  `);
}

main().catch(console.error);
