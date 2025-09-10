#!/usr/bin/env node

/**
 * Script para verificar la configuración de GitHub OAuth
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ No se encontró archivo .env');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'VITE_GITHUB_CLIENT_ID',
    'VITE_GITHUB_CLIENT_SECRET', 
    'VITE_GITHUB_REDIRECT_URI',
    'VITE_SUPABASE_URL'
  ];
  
  const missing = requiredVars.filter(varName => !envContent.includes(varName));
  
  if (missing.length > 0) {
    console.log('❌ Variables faltantes en .env:');
    missing.forEach(varName => console.log(`   - ${varName}`));
    return false;
  }
  
  console.log('✅ Archivo .env configurado correctamente');
  return true;
}

function generateEnvTemplate() {
  const template = `# GitHub OAuth Configuration
VITE_GITHUB_CLIENT_ID=tu_client_id_aqui
VITE_GITHUB_CLIENT_SECRET=tu_client_secret_aqui
VITE_GITHUB_REDIRECT_URI=http://localhost:8083/auth/github/callback

# Supabase Configuration
VITE_SUPABASE_URL=tu_supabase_url_aqui
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui

# Encryption Key (opcional)
VITE_ENCRYPTION_KEY=tu_clave_de_encriptacion_aqui
`;

  const envPath = path.join(__dirname, '..', '.env.example');
  fs.writeFileSync(envPath, template);
  console.log('📝 Archivo .env.example creado con la configuración requerida');
}

function main() {
  console.log('\n🔍 VERIFICANDO CONFIGURACIÓN DE GITHUB OAUTH');
  console.log('=' .repeat(50));
  
  const envOk = checkEnvFile();
  
  if (!envOk) {
    console.log('\n📋 CONFIGURACIÓN REQUERIDA:');
    console.log('\n1. Crea un archivo .env en la raíz del proyecto con:');
    generateEnvTemplate();
    
    console.log('\n2. Configura las variables de entorno en Supabase Edge Functions:');
    console.log('   - Ve a: Supabase Dashboard > Edge Functions > Settings > Environment Variables');
    console.log('   - Agrega (SIN prefijo VITE_):');
    console.log('     * GITHUB_CLIENT_ID = tu_client_id_de_github');
    console.log('     * GITHUB_CLIENT_SECRET = tu_client_secret_de_github');
    console.log('     * GITHUB_REDIRECT_URI = http://localhost:8083/auth/github/callback');
    
    console.log('\n3. Redeploya la Edge Function después de configurar las variables');
    
    console.log('\n4. Prueba el flujo de OAuth nuevamente');
    
    return;
  }
  
  console.log('\n✅ CONFIGURACIÓN LOCAL CORRECTA');
  console.log('\n⚠️  VERIFICA QUE LAS VARIABLES ESTÉN CONFIGURADAS EN SUPABASE:');
  console.log('   - Edge Functions > Settings > Environment Variables');
  console.log('   - Variables requeridas (SIN prefijo VITE_):');
  console.log('     * GITHUB_CLIENT_ID');
  console.log('     * GITHUB_CLIENT_SECRET');
  console.log('     * GITHUB_REDIRECT_URI');
  
  console.log('\n🔧 SI SIGUES VIENDO ERROR 500:');
  console.log('1. Verifica que las variables estén configuradas en Supabase');
  console.log('2. Redeploya la Edge Function');
  console.log('3. Revisa los logs de la Edge Function en Supabase Dashboard');
  
  console.log('\n📚 MÁS INFORMACIÓN:');
  console.log('- docs/CONFIGURACION_GITHUB_OAUTH_CORREGIDA.md');
  console.log('- Logs de Edge Function: Supabase Dashboard > Edge Functions > Logs');
}

main();
