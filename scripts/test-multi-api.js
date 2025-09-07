#!/usr/bin/env node

/**
 * Script de prueba para el sistema Multi-API de Websy AI
 * Verifica que las variables de entorno estén configuradas correctamente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Probando configuración del Sistema Multi-API de Websy AI\n');

// Cargar variables de entorno desde .env.local si existe
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
  
  console.log('✅ Archivo .env.local cargado');
} else {
  console.log('⚠️  Archivo .env.local no encontrado, usando variables del sistema');
}

// Verificar API keys de Gemini
const apiKeys = [];
for (let i = 1; i <= 5; i++) {
  const key = process.env[`VITE_GEMINI_API_KEY_${i}`] || process.env[`REACT_APP_GEMINI_API_KEY_${i}`];
  if (key && key.trim()) {
    apiKeys.push({
      index: i,
      key: key.trim(),
      isValid: key.startsWith('AIza') && key.length >= 20
    });
  }
}

const legacyKey = process.env.VITE_GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;

console.log('\n📋 Resumen de configuración:');
console.log(`   API Keys Multi-API encontradas: ${apiKeys.length}/5`);
console.log(`   API Key Legacy: ${legacyKey ? '✅' : '❌'}`);

if (apiKeys.length === 0 && !legacyKey) {
  console.log('\n❌ ERROR: No se encontraron API keys de Gemini configuradas');
  console.log('   Configura al menos una de las siguientes:');
  console.log('   - VITE_GEMINI_API_KEY_1');
  console.log('   - REACT_APP_GEMINI_API_KEY');
  process.exit(1);
}

console.log('\n🔑 API Keys detectadas:');
apiKeys.forEach(({ index, key, isValid }) => {
  const status = isValid ? '✅' : '❌';
  const maskedKey = key.substring(0, 8) + '...' + key.substring(key.length - 4);
  console.log(`   API ${index}: ${status} ${maskedKey}`);
});

if (legacyKey) {
  const isValid = legacyKey.startsWith('AIza') && legacyKey.length >= 20;
  const status = isValid ? '✅' : '❌';
  const maskedKey = legacyKey.substring(0, 8) + '...' + legacyKey.substring(legacyKey.length - 4);
  console.log(`   Legacy: ${status} ${maskedKey}`);
}

// Verificar Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n🗄️  Configuración de Supabase:');
console.log(`   URL: ${supabaseUrl ? '✅' : '❌'}`);
console.log(`   Key: ${supabaseKey ? '✅' : '❌'}`);

if (!supabaseUrl || !supabaseKey) {
  console.log('\n⚠️  ADVERTENCIA: Supabase no está configurado correctamente');
}

// Recomendaciones
console.log('\n💡 Recomendaciones:');

if (apiKeys.length === 1) {
  console.log('   - Considera configurar más API keys para el sistema de fallback');
  console.log('   - Esto evitará interrupciones por límites de solicitudes');
}

if (apiKeys.length >= 2) {
  console.log('   - ✅ Sistema Multi-API configurado correctamente');
  console.log('   - El sistema cambiará automáticamente entre API keys');
}

if (!legacyKey && apiKeys.length === 0) {
  console.log('   - Configura al menos VITE_GEMINI_API_KEY_1 para comenzar');
}

console.log('\n🚀 Para probar el sistema:');
console.log('   1. Ejecuta: pnpm dev');
console.log('   2. Ve a /websy-ai');
console.log('   3. Verifica el panel de estado de APIs en la barra lateral');
console.log('   4. Envía un mensaje para probar el chat');

console.log('\n✨ ¡Sistema Multi-API listo para usar!');
