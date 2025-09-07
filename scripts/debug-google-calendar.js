#!/usr/bin/env node

/**
 * Script de diagnóstico para Google Calendar
 * Verifica la configuración y variables de entorno
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Diagnóstico de Google Calendar');
console.log('================================');

// Verificar variables de entorno
const requiredVars = [
  'VITE_GOOGLE_API_KEY',
  'VITE_GOOGLE_CLIENT_ID'
];

console.log('\n📋 Variables de entorno requeridas:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADA`);
  }
});

const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

console.log('\n📁 Archivos de configuración:');
console.log(`✅ .env.example: ${fs.existsSync(path.join(process.cwd(), 'env.example')) ? 'EXISTE' : 'NO EXISTE'}`);
console.log(`📄 .env: ${fs.existsSync(envPath) ? 'EXISTE' : 'NO EXISTE'}`);
console.log(`📄 .env.local: ${fs.existsSync(envLocalPath) ? 'EXISTE' : 'NO EXISTE'}`);

if (fs.existsSync(envPath)) {
  console.log('\n📖 Contenido de .env:');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => 
    line.includes('GOOGLE') || line.includes('VITE_')
  );
  lines.forEach(line => {
    if (line.trim()) {
      console.log(`   ${line}`);
    }
  });
}

console.log('\n🔧 Recomendaciones:');
console.log('1. Crea un archivo .env en la raíz del proyecto');
console.log('2. Copia el contenido de env.example a .env');
console.log('3. Configura las variables VITE_GOOGLE_API_KEY y VITE_GOOGLE_CLIENT_ID');
console.log('4. Reinicia el servidor de desarrollo');

console.log('\n📚 Documentación de Google Calendar API:');
console.log('https://developers.google.com/calendar/api/quickstart/js');
console.log('https://console.developers.google.com/');
