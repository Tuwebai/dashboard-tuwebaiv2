#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧹 Limpiando cache y reconstruyendo aplicación...\n');

try {
  // Limpiar cache de Vite
  console.log('1. Limpiando cache de Vite...');
  if (fs.existsSync('node_modules/.vite')) {
    fs.rmSync('node_modules/.vite', { recursive: true, force: true });
    console.log('   ✅ Cache de Vite limpiado');
  }

  // Limpiar dist
  console.log('2. Limpiando directorio dist...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('   ✅ Directorio dist limpiado');
  }

  // Limpiar cache de npm
  console.log('3. Limpiando cache de npm...');
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('   ✅ Cache de npm limpiado');

  // Reinstalar dependencias
  console.log('4. Reinstalando dependencias...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('   ✅ Dependencias reinstaladas');

  // Reconstruir aplicación
  console.log('5. Reconstruyendo aplicación...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('   ✅ Aplicación reconstruida');

  console.log('\n🎉 Limpieza y reconstrucción completada exitosamente!');
  console.log('   Los errores de useState y Service Worker deberían estar resueltos.');

} catch (error) {
  console.error('❌ Error durante la limpieza y reconstrucción:', error.message);
  process.exit(1);
}
