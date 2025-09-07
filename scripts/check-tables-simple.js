/**
 * Script simple para verificar tablas de Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xebnhwjzchrsbhzbtlsg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlYm5od2p6Y2hyc2JoemJ0bHMiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNjM0NzQ5MywiZXhwIjoyMDUxOTIzNDkzfQ.8QZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tablas principales que sabemos que existen
const mainTables = ['users', 'projects', 'tickets', 'payments', 'conversations', 'conversation_messages'];

// Tablas que pueden no existir
const optionalTables = [
  'websy_conversation_memories',
  'websy_user_profiles', 
  'websy_knowledge_base',
  'project_phases',
  'tasks',
  'project_metrics',
  'project_activity_log',
  'project_attachments',
  'task_comments',
  'task_dependencies',
  'automation_dashboard',
  'automation_reports',
  'user_skills',
  'escalation_rules',
  'notification_analytics',
  'notification_delivery_logs',
  'scheduled_notifications',
  'project_messages',
  'project_tasks',
  'project_files',
  'chatRooms',
  'chatMessages',
  'comments',
  'report_templates',
  'report_executions',
  'approval_requests_with_details',
  'system_alerts',
  'system_triggers',
  'automation_logs',
  'performance_metrics'
];

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      return { exists: false, error: error.message };
    } else {
      return { exists: true, count: data?.length || 0 };
    }
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function main() {
  console.log('🔍 Verificando tablas principales...\n');
  
  for (const table of mainTables) {
    const result = await checkTable(table);
    if (result.exists) {
      console.log(`✅ ${table}: Existe`);
    } else {
      console.log(`❌ ${table}: ${result.error}`);
    }
  }
  
  console.log('\n🔍 Verificando tablas opcionales...\n');
  
  for (const table of optionalTables) {
    const result = await checkTable(table);
    if (result.exists) {
      console.log(`✅ ${table}: Existe`);
    } else {
      console.log(`❌ ${table}: ${result.error}`);
    }
  }
}

main().catch(console.error);
