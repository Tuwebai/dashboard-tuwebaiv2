import { supabase } from './supabase';
import { handleSupabaseError } from './errorHandler';

export interface UserPreferences {
  id?: string;
  user_id: string;
  preference_type: 'theme' | 'dashboard_widgets' | 'dashboard_layouts' | 'language' | 'welcome_back' | 'auth_state';
  preference_key: string;
  preference_value: any;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: string[];
  layout: any;
  isDefault?: boolean;
}

export class UserPreferencesService {
  // Obtener preferencias del usuario
  async getUserPreferences(userId: string, preferenceType?: string): Promise<UserPreferences[]> {
    try {
      let query = supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId);

      if (preferenceType) {
        query = query.eq('preference_type', preferenceType);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'Obtener preferencias del usuario');
      return [];
    }
  }

  // Guardar preferencia del usuario
  async saveUserPreference(
    userId: string, 
    preferenceType: string, 
    preferenceKey: string, 
    preferenceValue: any
  ): Promise<UserPreferences | null> {
    try {
      const preferenceData = {
        user_id: userId,
        preference_type: preferenceType as any,
        preference_key: preferenceKey,
        preference_value: preferenceValue,
        updated_at: new Date().toISOString()
      };

      // Usar upsert para evitar errores de constraint único
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(preferenceData, {
          onConflict: 'user_id,preference_type,preference_key',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.warn('Error al guardar preferencia, usando fallback:', error);
        // Fallback: intentar actualizar primero, luego insertar
        try {
          const { data: existing } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .eq('preference_type', preferenceType)
            .eq('preference_key', preferenceKey)
            .single();

          if (existing) {
            const { data: updateData, error: updateError } = await supabase
              .from('user_preferences')
              .update(preferenceData)
              .eq('id', existing.id)
              .select()
              .single();
            
            if (updateError) throw updateError;
            return updateData;
          } else {
            const { data: insertData, error: insertError } = await supabase
              .from('user_preferences')
              .insert([preferenceData])
              .select()
              .single();
            
            if (insertError) throw insertError;
            return insertData;
          }
        } catch (fallbackError) {
          console.warn('Fallback también falló, continuando sin guardar preferencia:', fallbackError);
          return null;
        }
      }

      return data;
    } catch (error) {
      console.warn('Error en saveUserPreference, continuando:', error);
      return null;
    }
  }

  // Eliminar preferencia del usuario
  async deleteUserPreference(
    userId: string, 
    preferenceType: string, 
    preferenceKey: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId)
        .eq('preference_type', preferenceType)
        .eq('preference_key', preferenceKey);

      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'Eliminar preferencia del usuario');
      return false;
    }
  }

  // Migrar datos de localStorage a la base de datos
  async migrateLocalStorageToDB(userId: string): Promise<void> {
    try {
      const migrations = [
        {
          type: 'theme',
          key: 'theme',
          getValue: () => localStorage.getItem('theme')
        },
        {
          type: 'dashboard_widgets',
          key: 'dashboard_widgets',
          getValue: () => localStorage.getItem('dashboard_widgets')
        },
        {
          type: 'dashboard_layouts',
          key: 'dashboard_layouts',
          getValue: () => localStorage.getItem('dashboardLayouts')
        },
        {
          type: 'language',
          key: 'i18nextLng',
          getValue: () => localStorage.getItem('i18nextLng')
        },
        {
          type: 'welcome_back',
          key: 'tuwebai_welcome_back',
          getValue: () => localStorage.getItem('tuwebai_welcome_back')
        },
        {
          type: 'auth_state',
          key: 'tuwebai_auth',
          getValue: () => localStorage.getItem('tuwebai_auth')
        }
      ];

      for (const migration of migrations) {
        const value = migration.getValue();
        if (value) {
          try {
            const parsedValue = JSON.parse(value);
            await this.saveUserPreference(userId, migration.type, migration.key, parsedValue);
          } catch {
            // Si no es JSON válido, guardar como string
            await this.saveUserPreference(userId, migration.type, migration.key, value);
          }
        }
      }

      // Limpiar localStorage después de migrar
      this.clearMigratedLocalStorage();
    } catch (error) {
      handleSupabaseError(error, 'Migrar localStorage a base de datos');
    }
  }

  // Limpiar localStorage después de migración
  private clearMigratedLocalStorage(): void {
    const keysToRemove = [
      'theme',
      'dashboard_widgets',
      'dashboardLayouts',
      'i18nextLng',
      'tuwebai_welcome_back',
      'tuwebai_auth'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Obtener tema del usuario
  async getUserTheme(userId: string): Promise<'light' | 'dark'> {
    try {
      const preferences = await this.getUserPreferences(userId, 'theme');
      const themePreference = preferences.find(p => p.preference_key === 'theme');
      
      if (themePreference && themePreference.preference_value) {
        return themePreference.preference_value;
      }
      
      return 'light'; // Tema por defecto
    } catch (error) {
      handleSupabaseError(error, 'Obtener tema del usuario');
      return 'light';
    }
  }

  // Guardar tema del usuario
  async saveUserTheme(userId: string, theme: 'light' | 'dark'): Promise<void> {
    await this.saveUserPreference(userId, 'theme', 'theme', theme);
  }

  // Obtener widgets del dashboard
  async getDashboardWidgets(userId: string): Promise<string[]> {
    try {
      const preferences = await this.getUserPreferences(userId, 'dashboard_widgets');
      const widgetsPreference = preferences.find(p => p.preference_key === 'dashboard_widgets');
      
      if (widgetsPreference && widgetsPreference.preference_value) {
        return widgetsPreference.preference_value;
      }
      
      return []; // Widgets por defecto
    } catch (error) {
      handleSupabaseError(error, 'Obtener widgets del dashboard');
      return [];
    }
  }

  // Guardar widgets del dashboard
  async saveDashboardWidgets(userId: string, widgets: string[]): Promise<void> {
    await this.saveUserPreference(userId, 'dashboard_widgets', 'dashboard_widgets', widgets);
  }

  // Obtener layouts del dashboard
  async getDashboardLayouts(userId: string): Promise<DashboardLayout[]> {
    try {
      const preferences = await this.getUserPreferences(userId, 'dashboard_layouts');
      const layoutsPreference = preferences.find(p => p.preference_key === 'dashboard_layouts');
      
      if (layoutsPreference && layoutsPreference.preference_value) {
        return layoutsPreference.preference_value;
      }
      
      return []; // Layouts por defecto
    } catch (error) {
      handleSupabaseError(error, 'Obtener layouts del dashboard');
      return [];
    }
  }

  // Guardar layouts del dashboard
  async saveDashboardLayouts(userId: string, layouts: DashboardLayout[]): Promise<void> {
    await this.saveUserPreference(userId, 'dashboard_layouts', 'dashboard_layouts', layouts);
  }

  // Obtener idioma del usuario
  async getUserLanguage(userId: string): Promise<string> {
    try {
      const preferences = await this.getUserPreferences(userId, 'language');
      const languagePreference = preferences.find(p => p.preference_key === 'i18nextLng');
      
      if (languagePreference && languagePreference.preference_value) {
        return languagePreference.preference_value;
      }
      
      return 'es'; // Idioma por defecto
    } catch (error) {
      handleSupabaseError(error, 'Obtener idioma del usuario');
      return 'es';
    }
  }

  // Guardar idioma del usuario
  async saveUserLanguage(userId: string, language: string): Promise<void> {
    await this.saveUserPreference(userId, 'language', 'i18nextLng', language);
  }

  // Sincronizar preferencias con localStorage (fallback)
  async syncWithLocalStorage(userId: string): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      preferences.forEach(preference => {
        const key = preference.preference_key;
        const value = preference.preference_value;
        
        switch (preference.preference_type) {
          case 'theme':
            localStorage.setItem('theme', value);
            break;
          case 'dashboard_widgets':
            localStorage.setItem('dashboard_widgets', JSON.stringify(value));
            break;
          case 'dashboard_layouts':
            localStorage.setItem('dashboardLayouts', JSON.stringify(value));
            break;
          case 'language':
            localStorage.setItem('i18nextLng', value);
            break;
          case 'welcome_back':
            localStorage.setItem('tuwebai_welcome_back', value);
            break;
          case 'auth_state':
            localStorage.setItem('tuwebai_auth', JSON.stringify(value));
            break;
        }
      });
    } catch (error) {
      handleSupabaseError(error, 'Sincronizar preferencias con localStorage');
    }
  }
}

export const userPreferencesService = new UserPreferencesService();
