// =====================================================
// TEST DE CONEXIÓN REAL CON SUPABASE
// =====================================================
// Este archivo es solo para verificar la conexión
// Se puede eliminar en producción

import { supabase } from './supabase';
import { projectService } from './projectService';

export async function testSupabaseConnection() {
  try {

    
    // 1. Verificar que las variables de entorno están configuradas
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    


    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variables de entorno de Supabase no configuradas');
    }

    // 2. Probar conexión básica
    // console.log('🔍 Probando conexión básica...');
    const { data: testData, error: testError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error de conexión:', testError);
      throw testError;
    }
    
    // console.log('✅ Conexión básica exitosa');

    // 3. Probar obtener proyectos
    // console.log('📁 Probando obtención de proyectos...');
    const projects = await projectService.getProjects();
    // console.log('✅ Proyectos obtenidos:', projects.projects.length);
    // console.log('📊 Total de proyectos:', projects.total);

    // 4. Probar estadísticas
    // console.log('📊 Probando estadísticas...');
    const stats = await projectService.getProjectStats();
    // console.log('✅ Estadísticas obtenidas:', stats);

    // 5. Probar tecnologías
    // console.log('🔧 Probando tecnologías...');
    const technologies = await projectService.getUniqueTechnologies();
    // console.log('✅ Tecnologías obtenidas:', technologies.length);

    // console.log('🎉 ¡Todas las pruebas de conexión pasaron exitosamente!');
    // console.log('📋 Resumen:');
    // console.log('- Conexión a Supabase: ✅ FUNCIONANDO');
    // console.log('- Tabla projects: ✅ ACCESIBLE');
    // console.log('- Project Service: ✅ FUNCIONANDO');
    // console.log('- Datos reales: ✅ OBTENIDOS');
    
    return {
      success: true,
      projectsCount: projects.total,
      stats,
      technologiesCount: technologies.length
    };

  } catch (error) {
    console.error('❌ Error en las pruebas de conexión:', error);
    
    if (error.message.includes('variables de entorno')) {
      console.error('💡 Solución: Verifica que tienes un archivo .env con:');
      console.error('   VITE_SUPABASE_URL=tu_url_de_supabase');
      console.error('   VITE_SUPABASE_ANON_KEY=tu_clave_anonima');
    } else if (error.message.includes('projects')) {
      console.error('💡 Solución: Verifica que la tabla "projects" existe en tu base de datos');
    } else if (error.message.includes('permission')) {
      console.error('💡 Solución: Verifica los permisos RLS (Row Level Security) en Supabase');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para verificar el estado de la base de datos
export async function checkDatabaseStatus() {
  try {
    // console.log('🔍 Verificando estado de la base de datos...');
    
    // Verificar si la tabla projects existe
    const { data: tableInfo, error: tableError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accediendo a la tabla projects:', tableError);
      return {
        tableExists: false,
        error: tableError.message
      };
    }
    
    // Verificar estructura de la tabla
    const { data: sampleData, error: sampleError } = await supabase
      .from('projects')
      .select('id, name, description, technologies, status, created_at, updated_at')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error verificando estructura de la tabla:', sampleError);
      return {
        tableExists: true,
        structureValid: false,
        error: sampleError.message
      };
    }
    
    // console.log('✅ Tabla projects existe y es accesible');
    // console.log('✅ Estructura de la tabla es válida');
    
    return {
      tableExists: true,
      structureValid: true,
      sampleData: sampleData
    };
    
  } catch (error) {
    console.error('❌ Error verificando estado de la base de datos:', error);
    return {
      tableExists: false,
      error: error.message
    };
  }
}

// Función principal para ejecutar todas las verificaciones
export async function runFullDatabaseCheck() {
  // console.log('🚀 Iniciando verificación completa de la base de datos...\n');
  
  const dbStatus = await checkDatabaseStatus();
  const connectionTest = await testSupabaseConnection();
  
  // console.log('\n📋 Resumen completo:');
  // console.log('🔌 Base de datos:', dbStatus.tableExists ? '✅ ACCESIBLE' : '❌ NO ACCESIBLE');
  // console.log('📊 Estructura:', dbStatus.structureValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
  // console.log('🔗 Conexión:', connectionTest.success ? '✅ FUNCIONANDO' : '❌ FALLANDO');
  
  if (dbStatus.tableExists && dbStatus.structureValid && connectionTest.success) {
    // console.log('\n🎉 ¡La base de datos está completamente funcional!');
    // console.log('📈 Proyectos en la base de datos:', connectionTest.projectsCount);
    // console.log('🔧 Tecnologías disponibles:', connectionTest.technologiesCount);
  } else {
    // console.log('\n⚠️ Hay problemas con la base de datos que necesitan atención');
  }
  
  return {
    databaseStatus: dbStatus,
    connectionStatus: connectionTest
  };
}

export default {
  testSupabaseConnection,
  checkDatabaseStatus,
  runFullDatabaseCheck
};
