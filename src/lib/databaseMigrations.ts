import { supabase } from './supabase';

export interface MigrationResult {
  success: boolean;
  message: string;
  error?: any;
}

export class DatabaseMigrations {
  private static instance: DatabaseMigrations;

  static getInstance(): DatabaseMigrations {
    if (!DatabaseMigrations.instance) {
      DatabaseMigrations.instance = new DatabaseMigrations();
    }
    return DatabaseMigrations.instance;
  }

  // Crear indexes para mejorar el rendimiento de consultas frecuentes
  async createIndexes(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    try {
      // Indexes para projects
      const { error: idx1 } = await supabase.rpc('create_index', {
        table_name: 'projects',
        index_name: 'idx_projects_created_at',
        columns: ['created_at']
      });

      results.push({
        success: !idx1,
        message: idx1 ? `Error creando index projects.created_at: ${idx1.message}` : 'Index projects.created_at creado exitosamente'
      });

      const { error: idx2 } = await supabase.rpc('create_index', {
        table_name: 'projects',
        index_name: 'idx_projects_updated_at',
        columns: ['updated_at']
      });

      results.push({
        success: !idx2,
        message: idx2 ? `Error creando index projects.updated_at: ${idx2.message}` : 'Index projects.updated_at creado exitosamente'
      });

      const { error: idx3 } = await supabase.rpc('create_index', {
        table_name: 'projects',
        index_name: 'idx_projects_name',
        columns: ['name']
      });

      results.push({
        success: !idx3,
        message: idx3 ? `Error creando index projects.name: ${idx3.message}` : 'Index projects.name creado exitosamente'
      });

      // Indexes para payments
      const { error: idx4 } = await supabase.rpc('create_index', {
        table_name: 'payments',
        index_name: 'idx_payments_created_at',
        columns: ['created_at']
      });

      results.push({
        success: !idx4,
        message: idx4 ? `Error creando index payments.created_at: ${idx4.message}` : 'Index payments.created_at creado exitosamente'
      });

      const { error: idx5 } = await supabase.rpc('create_index', {
        table_name: 'payments',
        index_name: 'idx_payments_status',
        columns: ['status']
      });

      results.push({
        success: !idx5,
        message: idx5 ? `Error creando index payments.status: ${idx5.message}` : 'Index payments.status creado exitosamente'
      });

      // Indexes para user_invitations
      const { error: idx6 } = await supabase.rpc('create_index', {
        table_name: 'user_invitations',
        index_name: 'idx_user_invitations_status',
        columns: ['status']
      });

      results.push({
        success: !idx6,
        message: idx6 ? `Error creando index user_invitations.status: ${idx6.message}` : 'Index user_invitations.status creado exitosamente'
      });

      // Indexes para project_versions
      const { error: idx7 } = await supabase.rpc('create_index', {
        table_name: 'project_versions',
        index_name: 'idx_project_versions_created_at',
        columns: ['created_at']
      });

      results.push({
        success: !idx7,
        message: idx7 ? `Error creando index project_versions.created_at: ${idx7.message}` : 'Index project_versions.created_at creado exitosamente'
      });

      // Indexes para deployments
      const { error: idx8 } = await supabase.rpc('create_index', {
        table_name: 'deployments',
        index_name: 'idx_deployments_status',
        columns: ['status']
      });

      results.push({
        success: !idx8,
        message: idx8 ? `Error creando index deployments.status: ${idx8.message}` : 'Index deployments.status creado exitosamente'
      });

      // Indexes compuestos
      const { error: idx9 } = await supabase.rpc('create_index', {
        table_name: 'payments',
        index_name: 'idx_payments_user_status',
        columns: ['user_id', 'status']
      });

      results.push({
        success: !idx9,
        message: idx9 ? `Error creando index compuesto payments.user_id+status: ${idx9.message}` : 'Index compuesto payments.user_id+status creado exitosamente'
      });

    } catch (error) {
      results.push({
        success: false,
        message: `Error general creando indexes: ${error}`,
        error
      });
    }

    return results;
  }

  // Crear funciones auxiliares para los triggers
  async createHelperFunctions(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    try {
      // Función para actualizar updated_at automáticamente
      const { error: func1 } = await supabase.rpc('create_function', {
        function_name: 'update_updated_at_column',
        function_body: `
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ language 'plpgsql';
        `
      });

      results.push({
        success: !func1,
        message: func1 ? `Error creando función update_updated_at_column: ${func1.message}` : 'Función update_updated_at_column creada exitosamente'
      });

      // Función para obtener estadísticas de proyecto
      const { error: func2 } = await supabase.rpc('create_function', {
        function_name: 'get_project_stats',
        function_body: `
          CREATE OR REPLACE FUNCTION get_project_stats(project_uuid UUID)
          RETURNS TABLE(
            total_deployments INTEGER,
            total_versions INTEGER,
            last_deployment TIMESTAMP,
            last_version TIMESTAMP
          ) AS $$
          BEGIN
            RETURN QUERY
            SELECT 
              (SELECT COUNT(*) FROM deployments WHERE project_id = project_uuid) as total_deployments,
              (SELECT COUNT(*) FROM project_versions WHERE project_id = project_uuid) as total_versions,
              (SELECT MAX(created_at) FROM deployments WHERE project_id = project_uuid) as last_deployment,
              (SELECT MAX(created_at) FROM project_versions WHERE project_id = project_uuid) as last_version;
          END;
          $$ language 'plpgsql';
        `
      });

      results.push({
        success: !func2,
        message: func2 ? `Error creando función get_project_stats: ${func2.message}` : 'Función get_project_stats creada exitosamente'
      });

      // Función para obtener estadísticas de usuario
      const { error: func3 } = await supabase.rpc('create_function', {
        function_name: 'get_user_stats',
        function_body: `
          CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
          RETURNS TABLE(
            total_projects INTEGER,
            total_payments INTEGER,
            total_amount DECIMAL,
            total_invitations INTEGER
          ) AS $$
          BEGIN
            RETURN QUERY
            SELECT 
              (SELECT COUNT(*) FROM projects WHERE created_by = user_uuid) as total_projects,
              (SELECT COUNT(*) FROM payments WHERE user_id = user_uuid) as total_payments,
              (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE user_id = user_uuid) as total_amount,
              (SELECT COUNT(*) FROM user_invitations WHERE invited_by = user_uuid) as total_invitations;
          END;
          $$ language 'plpgsql';
        `
      });

      results.push({
        success: !func3,
        message: func3 ? `Error creando función get_user_stats: ${func3.message}` : 'Función get_user_stats creada exitosamente'
      });

    } catch (error) {
      results.push({
        success: false,
        message: `Error general creando funciones auxiliares: ${error}`,
        error
      });
    }

    return results;
  }

  // Crear triggers para mantener consistencia de datos
  async createTriggers(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    try {
      // Trigger para actualizar updated_at en projects
      const { error: trg1 } = await supabase.rpc('create_trigger', {
        table_name: 'projects',
        trigger_name: 'trg_projects_updated_at',
        function_name: 'update_updated_at_column',
        events: ['UPDATE']
      });

      results.push({
        success: !trg1,
        message: trg1 ? `Error creando trigger projects.updated_at: ${trg1.message}` : 'Trigger projects.updated_at creado exitosamente'
      });

      // Trigger para actualizar updated_at en project_versions
      const { error: trg2 } = await supabase.rpc('create_trigger', {
        table_name: 'project_versions',
        trigger_name: 'trg_project_versions_updated_at',
        function_name: 'update_updated_at_column',
        events: ['UPDATE']
      });

      results.push({
        success: !trg2,
        message: trg2 ? `Error creando trigger project_versions.updated_at: ${trg2.message}` : 'Trigger project_versions.updated_at creado exitosamente'
      });

      // Trigger para actualizar updated_at en deployments
      const { error: trg3 } = await supabase.rpc('create_trigger', {
        table_name: 'deployments',
        trigger_name: 'trg_deployments_updated_at',
        function_name: 'update_updated_at_column',
        events: ['UPDATE']
      });

      results.push({
        success: !trg3,
        message: trg3 ? `Error creando trigger deployments.updated_at: ${trg3.message}` : 'Trigger deployments.updated_at creado exitosamente'
      });

    } catch (error) {
      results.push({
        success: false,
        message: `Error general creando triggers: ${error}`,
        error
      });
    }

    return results;
  }

  // Ejecutar todas las migraciones
  async runAllMigrations(): Promise<{
    indexes: MigrationResult[];
    triggers: MigrationResult[];
    helperFunctions: MigrationResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {


    const indexes = await this.createIndexes();
    const helperFunctions = await this.createHelperFunctions();
    const triggers = await this.createTriggers();

    const allResults = [...indexes, ...triggers, ...helperFunctions];
    const successful = allResults.filter(r => r.success).length;
    const failed = allResults.filter(r => !r.success).length;

    const summary = {
      total: allResults.length,
      successful,
      failed
    };



    return {
      indexes,
      triggers,
      helperFunctions,
      summary
    };
  }

  // Verificar estado actual de la base de datos
  async checkDatabaseStatus(): Promise<{
    foreignKeys: any[];
    indexes: any[];
    triggers: any[];
    functions: any[];
  }> {
    try {
      // Verificar foreign keys existentes
      const { data: fks, error: fkError } = await supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('constraint_type', 'FOREIGN KEY');

      // Verificar indexes existentes
      const { data: idxs, error: idxError } = await supabase
        .from('pg_indexes')
        .select('*')
        .not('indexname', 'like', 'pg_%');

      // Verificar triggers existentes
      const { data: trgs, error: trgError } = await supabase
        .from('information_schema.triggers')
        .select('*');

      // Verificar funciones existentes
      const { data: funcs, error: funcError } = await supabase
        .from('information_schema.routines')
        .select('*')
        .eq('routine_type', 'FUNCTION');

      return {
        foreignKeys: fks || [],
        indexes: idxs || [],
        triggers: trgs || [],
        functions: funcs || []
      };

    } catch (error) {
      console.error('Error verificando estado de la base de datos:', error);
      return {
        foreignKeys: [],
        indexes: [],
        triggers: [],
        functions: []
      };
    }
  }
}

// Instancia global
export const databaseMigrations = DatabaseMigrations.getInstance();
