#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para verificar variables de entorno
function checkEnvironmentVariables() {
  console.log('🔍 Verificando variables de entorno...\n');
  
  const envFiles = ['.env.local', '.env'];
  let envContent = '';
  
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, '..', envFile);
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log(`✅ Archivo encontrado: ${envFile}`);
      break;
    }
  }
  
  if (!envContent) {
    console.log('❌ No se encontró archivo .env.local o .env');
    return false;
  }
  
  // Verificar variables de Google Calendar
  const googleApiKey = envContent.match(/VITE_GOOGLE_API_KEY=(.+)/);
  const googleClientId = envContent.match(/VITE_GOOGLE_CLIENT_ID=(.+)/);
  
  console.log('\n📋 Variables de Google Calendar:');
  console.log(`VITE_GOOGLE_API_KEY: ${googleApiKey ? '✅ Configurada' : '❌ No configurada'}`);
  console.log(`VITE_GOOGLE_CLIENT_ID: ${googleClientId ? '✅ Configurada' : '❌ No configurada'}`);
  
  if (googleApiKey && googleClientId) {
    console.log('\n🎉 ¡Google Calendar está configurado correctamente!');
    console.log('El sistema usará el servicio real de Google Calendar.');
    return true;
  } else {
    console.log('\n⚠️  Google Calendar no está configurado completamente.');
    console.log('El sistema usará el servicio simulado.');
    return false;
  }
}

// Función para verificar archivos del servicio
function checkServiceFiles() {
  console.log('\n🔍 Verificando archivos del servicio...\n');
  
  const serviceFiles = [
    'src/lib/googleCalendarService.ts',
    'src/lib/googleCalendarServiceSimple.ts',
    'src/hooks/useGoogleCalendar.ts',
    'src/types/google.d.ts'
  ];
  
  let allFilesExist = true;
  
  for (const file of serviceFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - No encontrado`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

// Función principal
async function main() {
  console.log('🚀 Verificador de Google Calendar\n');
  console.log('=====================================\n');
  
  const envOk = checkEnvironmentVariables();
  const filesOk = checkServiceFiles();
  
  console.log('\n📊 Resumen:');
  console.log(`Variables de entorno: ${envOk ? '✅' : '❌'}`);
  console.log(`Archivos del servicio: ${filesOk ? '✅' : '❌'}`);
  
  if (envOk && filesOk) {
    console.log('\n🎉 ¡Todo está configurado correctamente!');
    console.log('El asistente podrá programar reuniones reales en Google Calendar.');
  } else {
    console.log('\n⚠️  Hay problemas en la configuración.');
    console.log('El asistente usará el modo simulado hasta que se resuelvan.');
  }
  
  console.log('\n📝 Próximos pasos:');
  if (!envOk) {
    console.log('1. Configura las variables VITE_GOOGLE_API_KEY y VITE_GOOGLE_CLIENT_ID en .env.local');
    console.log('2. Reinicia el servidor de desarrollo (pnpm dev)');
  }
  if (!filesOk) {
    console.log('1. Verifica que todos los archivos del servicio estén presentes');
  }
  if (envOk && filesOk) {
    console.log('1. Ve a la página de Websy AI');
    console.log('2. Haz clic en "Conectar con Google Calendar"');
    console.log('3. Autoriza el acceso a tu calendario');
    console.log('4. ¡Pide al asistente que programe una reunión!');
  }
}

main().catch(console.error);
