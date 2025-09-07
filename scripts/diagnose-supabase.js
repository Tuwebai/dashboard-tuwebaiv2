#!/usr/bin/env node

/**
 * Script de diagnóstico para verificar la estructura de las tablas de Supabase
 * Ayuda a identificar qué columnas existen realmente
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Diagnóstico de estructura de tablas de Supabase\n');

// Cargar variables de entorno
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ ERROR: Variables de Supabase no configuradas');
  console.log('   Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseTable(tableName, testColumns = []) {
  console.log(`\n📋 Diagnóstico de tabla: ${tableName}`);
  console.log('─'.repeat(50));
  
  try {
    // 1. Verificar si la tabla existe
    const { data: tableExists, error: tableError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log(`❌ Error accediendo a la tabla: ${tableError.message}`);
      return;
    }
    
    console.log(`✅ Tabla ${tableName} existe y es accesible`);
    
    // 2. Probar columnas específicas si se proporcionan
    if (testColumns.length > 0) {
      console.log(`\n🔍 Probando columnas: ${testColumns.join(', ')}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select(testColumns.join(', '))
        .limit(1);
      
      if (error) {
        console.log(`❌ Error con columnas específicas: ${error.message}`);
        
        // Probar columnas una por una
        console.log('\n🔍 Probando columnas individualmente:');
        for (const column of testColumns) {
          try {
            const { error: colError } = await supabase
              .from(tableName)
              .select(column)
              .limit(1);
            
            if (colError) {
              console.log(`   ❌ ${column}: ${colError.message}`);
            } else {
              console.log(`   ✅ ${column}: OK`);
            }
          } catch (err) {
            console.log(`   ❌ ${column}: ${err.message}`);
          }
        }
      } else {
        console.log(`✅ Todas las columnas funcionan correctamente`);
        if (data && data.length > 0) {
          console.log(`📊 Datos de ejemplo:`, data[0]);
        }
      }
    }
    
    // 3. Obtener estructura básica
    console.log(`\n📊 Estructura básica de la tabla:`);
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (!sampleError && sampleData && sampleData.length > 0) {
      const columns = Object.keys(sampleData[0]);
      console.log(`   Columnas disponibles: ${columns.join(', ')}`);
    } else {
      console.log(`   ⚠️  No se pudieron obtener columnas (tabla vacía o error)`);
    }
    
  } catch (error) {
    console.log(`❌ Error inesperado: ${error.message}`);
  }
}

async function main() {
  console.log(`🔗 Conectando a Supabase...`);
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
  
  // Diagnóstico de tablas principales
  await diagnoseTable('projects', ['id', 'name', 'status', 'progress', 'created_at', 'created_by']);
  await diagnoseTable('users', ['id', 'full_name', 'email', 'role', 'created_at']);
  await diagnoseTable('tickets', ['id', 'asunto', 'status', 'prioridad', 'created_at', 'user_id']);
  await diagnoseTable('chat_history', ['id', 'user_id', 'message', 'is_ai_message', 'created_at']);
  await diagnoseTable('conversations', ['id', 'user_id', 'title', 'context_type', 'created_at']);
  await diagnoseTable('ai_settings', ['id', 'user_id', 'settings', 'created_at']);
  
  console.log('\n✨ Diagnóstico completado');
  console.log('\n💡 Recomendaciones:');
  console.log('   1. Usa solo las columnas que aparecen como ✅');
  console.log('   2. Evita las columnas que aparecen como ❌');
  console.log('   3. Si una tabla no existe, ejecuta el script SQL correspondiente');
}

main().catch(console.error);
