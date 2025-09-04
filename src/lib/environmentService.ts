import { supabase } from './supabase';

export interface EnvironmentVariable {
  id?: string;
  key: string;
  value: string;
  isSensitive: boolean;
  environment: string;
  project_id?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export const environmentService = {
  // Obtener variables de entorno por proyecto y entorno
  async getEnvironmentVariables(projectId?: string, environment: string = 'production'): Promise<EnvironmentVariable[]> {
    try {
      if (!projectId) {
        console.warn('No project ID provided, returning empty array');
        return [];
      }

      const { data, error } = await supabase
        .from('environment_variables')
        .select('*')
        .eq('project_id', projectId)
        .eq('environment', environment)
        .order('key');

      if (error) {
        console.error('Error fetching environment variables:', error);
        // Si la tabla no existe, usar localStorage como fallback
        return this.getFromLocalStorage(environment);
      }

      // Convertir los datos de Supabase al formato esperado
      return (data || []).map(item => ({
        id: item.id,
        key: item.key,
        value: item.value,
        isSensitive: item.is_sensitive,
        environment: item.environment,
        project_id: item.project_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        created_by: item.created_by
      }));
    } catch (error) {
      console.error('Error in getEnvironmentVariables:', error);
      return this.getFromLocalStorage(environment);
    }
  },

  // Crear o actualizar variable de entorno
  async upsertEnvironmentVariable(variable: EnvironmentVariable): Promise<EnvironmentVariable> {
    try {
      // Validar la variable antes de guardar
      const validation = this.validateVariable(variable);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Validación de seguridad adicional
      if (!variable.project_id) {
        throw new Error('Project ID es requerido para seguridad');
      }

      // Verificar que el usuario tiene acceso al proyecto (seguridad adicional)
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, user_id')
        .eq('id', variable.project_id)
        .single();

      if (projectError || !project) {
        throw new Error('Proyecto no encontrado o acceso denegado');
      }

      // Preparar los datos para Supabase
      const variableData = {
        key: variable.key.trim().toUpperCase(),
        value: variable.value,
        is_sensitive: variable.isSensitive,
        environment: variable.environment || 'production',
        project_id: variable.project_id,
        created_by: variable.created_by
      };

      if (variable.id) {
        // Actualizar variable existente
        const { data, error } = await supabase
          .from('environment_variables')
          .update(variableData)
          .eq('id', variable.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating environment variable:', error);
          throw error;
        }

        return data;
      } else {
        // Crear nueva variable
        const { data, error } = await supabase
          .from('environment_variables')
          .insert([variableData])
          .select()
          .single();

        if (error) {
          console.error('Error creating environment variable:', error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in upsertEnvironmentVariable:', error);
      // Fallback a localStorage solo si es un error de red/base de datos
      if (error instanceof Error && error.message.includes('network') || error instanceof Error && error.message.includes('database')) {
        return this.saveToLocalStorage(variable);
      }
      throw error;
    }
  },

  // Eliminar variable de entorno
  async deleteEnvironmentVariable(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('environment_variables')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting environment variable:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteEnvironmentVariable:', error);
      // Fallback a localStorage solo si es un error de red/base de datos
      if (error instanceof Error && error.message.includes('network') || error instanceof Error && error.message.includes('database')) {
        this.deleteFromLocalStorage(id);
      } else {
        throw error;
      }
    }
  },

  // Exportar variables como archivo .env
  exportAsEnvFile(variables: EnvironmentVariable[]): void {
    const envContent = variables
      .map(v => `${v.key}=${v.value}`)
      .join('\n');
    
    const blob = new Blob([envContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Métodos de fallback con localStorage
  getFromLocalStorage(environment: string): EnvironmentVariable[] {
    try {
      const saved = localStorage.getItem(`environmentVariables_${environment}`);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  saveToLocalStorage(variable: EnvironmentVariable): EnvironmentVariable {
    try {
      const variables = this.getFromLocalStorage(variable.environment);
      const existingIndex = variables.findIndex(v => v.key === variable.key);
      
      if (existingIndex >= 0) {
        variables[existingIndex] = { ...variable, id: variable.id || `local_${Date.now()}` };
      } else {
        variables.push({ ...variable, id: `local_${Date.now()}` });
      }

      localStorage.setItem(`environmentVariables_${variable.environment}`, JSON.stringify(variables));
      return variable;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return variable;
    }
  },

  deleteFromLocalStorage(id: string): void {
    try {
      const environments = ['production', 'development', 'staging'];
      environments.forEach(env => {
        const variables = this.getFromLocalStorage(env);
        const filtered = variables.filter(v => v.id !== id);
        localStorage.setItem(`environmentVariables_${env}`, JSON.stringify(filtered));
      });
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
    }
  },

  // Validar variable de entorno
  validateVariable(variable: EnvironmentVariable): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!variable.key || variable.key.trim().length === 0) {
      errors.push('La clave de la variable es requerida');
    }

    if (variable.key && variable.key.length > 255) {
      errors.push('La clave no puede exceder 255 caracteres');
    }

    if (variable.key && !/^[A-Z_][A-Z0-9_]*$/.test(variable.key)) {
      errors.push('La clave debe estar en mayúsculas y solo puede contener letras, números y guiones bajos');
    }

    if (!variable.environment) {
      errors.push('El entorno es requerido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Obtener variables de ejemplo para nuevos proyectos
  getDefaultVariables(): EnvironmentVariable[] {
    return [
      { key: 'NODE_ENV', value: 'production', isSensitive: false, environment: 'production' },
      { key: 'PORT', value: '3000', isSensitive: false, environment: 'production' },
      { key: 'DATABASE_URL', value: 'postgresql://user:pass@host:5432/db', isSensitive: true, environment: 'production' },
      { key: 'JWT_SECRET', value: 'your-super-secret-jwt-key-here', isSensitive: true, environment: 'production' },
      { key: 'API_KEY', value: 'your-api-key-here', isSensitive: true, environment: 'production' },
      { key: 'CORS_ORIGINS', value: 'https://yourdomain.com', isSensitive: false, environment: 'production' },
      { key: 'REDIS_URL', value: 'redis://your-redis-host:6379', isSensitive: false, environment: 'production' },
      { key: 'AWS_ACCESS_KEY_ID', value: 'your-aws-access-key', isSensitive: true, environment: 'production' },
      { key: 'AWS_SECRET_ACCESS_KEY', value: 'your-aws-secret-key', isSensitive: true, environment: 'production' },
      { key: 'AWS_REGION', value: 'us-east-1', isSensitive: false, environment: 'production' }
    ];
  }
};
