import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

console.log('🔧 Probando conexión con Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': supabaseKey
    }
  },
  db: {
    schema: 'public'
  }
});

async function testConnection() {
  try {
    console.log('\n📡 Probando conexión básica...');
    
    // Probar conexión básica
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .abortSignal(AbortSignal.timeout(10000));
    
    if (error) {
      console.error('❌ Error de conexión:', error);
      return;
    }
    
    console.log('✅ Conexión básica exitosa');
    
    // Probar tablas de memoria
    console.log('\n🧠 Probando tablas de memoria...');
    
    const tables = [
      'websy_user_profiles',
      'websy_conversation_memories', 
      'websy_knowledge_base'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
          .abortSignal(AbortSignal.timeout(5000));
        
        if (error) {
          console.log(`⚠️  Tabla ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabla ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Tabla ${table}: ${err.message}`);
      }
    }
    
    console.log('\n🎉 Prueba de conexión completada');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testConnection();
