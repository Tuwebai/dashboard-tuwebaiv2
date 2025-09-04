#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Analizando tamaño del bundle...\n');

try {
  // Ejecutar build
  console.log('📦 Ejecutando build de producción...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Analizar archivos generados
  const distPath = path.join(process.cwd(), 'dist');
  const assetsPath = path.join(distPath, 'assets');
  
  if (!fs.existsSync(assetsPath)) {
    console.error('❌ No se encontró la carpeta assets en dist/');
    process.exit(1);
  }
  
  const files = fs.readdirSync(assetsPath);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  const cssFiles = files.filter(file => file.endsWith('.css'));
  
  console.log('\n📊 Análisis de archivos generados:');
  console.log('=====================================');
  
  let totalSize = 0;
  
  // Analizar archivos JS
  console.log('\n📄 Archivos JavaScript:');
  jsFiles.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalSize += stats.size;
    console.log(`  ${file}: ${sizeKB} KB`);
  });
  
  // Analizar archivos CSS
  console.log('\n🎨 Archivos CSS:');
  cssFiles.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalSize += stats.size;
    console.log(`  ${file}: ${sizeKB} KB`);
  });
  
  console.log('\n📈 Resumen:');
  console.log('=====================================');
  console.log(`Total de archivos: ${jsFiles.length + cssFiles.length}`);
  console.log(`Tamaño total: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`Tamaño total: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
  
  // Identificar archivos grandes
  const largeFiles = [];
  jsFiles.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    if (stats.size > 100 * 1024) { // > 100KB
      largeFiles.push({ file, size: stats.size });
    }
  });
  
  if (largeFiles.length > 0) {
    console.log('\n⚠️  Archivos grandes (>100KB):');
    largeFiles.forEach(({ file, size }) => {
      console.log(`  ${file}: ${(size / 1024).toFixed(2)} KB`);
    });
  }
  
} catch (error) {
  console.error('❌ Error durante el análisis:', error.message);
  process.exit(1);
}
