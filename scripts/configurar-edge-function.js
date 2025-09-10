#!/usr/bin/env node

/**
 * Script para configurar las variables de entorno de la Edge Function de GitHub OAuth
 * 
 * INSTRUCCIONES:
 * 1. Ejecuta este script: node scripts/configurar-edge-function.js
 * 2. Sigue las instrucciones para configurar las variables en Supabase
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🔧 CONFIGURACIÓN DE EDGE FUNCTION - GITHUB OAUTH');
  console.log('=' .repeat(50));
  
  console.log('\n📋 PASOS PARA CONFIGURAR LAS VARIABLES DE ENTORNO:');
  console.log('\n1. Ve a tu dashboard de Supabase:');
  console.log('   https://supabase.com/dashboard/project/[TU_PROJECT_ID]');
  
  console.log('\n2. Navega a: Edge Functions > Settings > Environment Variables');
  
  console.log('\n3. Agrega las siguientes variables (SIN prefijo VITE_):');
  console.log('   - GITHUB_CLIENT_ID = tu_client_id_de_github');
  console.log('   - GITHUB_CLIENT_SECRET = tu_client_secret_de_github');
  console.log('   - GITHUB_REDIRECT_URI = http://localhost:8083/auth/github/callback');
  
  console.log('\n4. Después de agregar las variables, redeploya la Edge Function:');
  console.log('   - Ve a Edge Functions > github-token-exchange');
  console.log('   - Haz click en "Redeploy" o "Deploy"');
  
  console.log('\n🔍 VERIFICACIÓN:');
  console.log('\nPara verificar que las variables están configuradas:');
  console.log('1. Ve a Edge Functions > github-token-exchange > Logs');
  console.log('2. Haz una prueba de OAuth');
  console.log('3. En los logs deberías ver:');
  console.log('   "GitHub OAuth Config: { clientId: ***1234, clientSecret: ***5678, ... }"');
  
  console.log('\n❌ ERROR ACTUAL:');
  console.log('El error 500 "Server configuration error" indica que las variables');
  console.log('GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET no están configuradas en Supabase.');
  
  console.log('\n✅ DESPUÉS DE CONFIGURAR:');
  console.log('El flujo de OAuth debería funcionar correctamente sin errores 500.');
  
  const hasConfigured = await question('\n¿Ya configuraste las variables de entorno? (y/n): ');
  
  if (hasConfigured.toLowerCase() === 'y') {
    console.log('\n🎉 ¡Perfecto! Ahora prueba el flujo de OAuth nuevamente.');
    console.log('Si sigues viendo errores 500, verifica que las variables estén correctas.');
  } else {
    console.log('\n📝 Configura las variables primero y luego ejecuta este script de nuevo.');
  }
  
  console.log('\n📚 DOCUMENTACIÓN ADICIONAL:');
  console.log('- Archivo de configuración: docs/CONFIGURACION_GITHUB_OAUTH_CORREGIDA.md');
  console.log('- Logs de Edge Function: Supabase Dashboard > Edge Functions > Logs');
  
  rl.close();
}

main().catch(console.error);
