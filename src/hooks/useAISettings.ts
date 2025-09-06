import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';

export interface AISettings {
  temperature: number; // 0.0 - 1.0
  maxTokens: number; // 1 - 8192
  enableContextAnalysis: boolean;
  enablePredictiveAnalysis: boolean;
  enableAutoReports: boolean;
  enableNotifications: boolean;
  responseStyle: 'concise' | 'detailed' | 'balanced';
  language: 'es' | 'en';
  autoSave: boolean;
  maxHistoryLength: number;
}

const defaultSettings: AISettings = {
  temperature: 0.7,
  maxTokens: 2048,
  enableContextAnalysis: true,
  enablePredictiveAnalysis: true,
  enableAutoReports: false,
  enableNotifications: true,
  responseStyle: 'balanced',
  language: 'es',
  autoSave: true,
  maxHistoryLength: 50
};

export const useAISettings = () => {
  const { user } = useApp();
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar configuraciones del usuario
  const loadSettings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('ai_settings')
        .select('settings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        // Continuar con configuraciones por defecto en caso de error
        setSettings(defaultSettings);
      } else if (data?.settings) {
        setSettings({ ...defaultSettings, ...data.settings });
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error cargando configuraciones');
      // En caso de error, usar configuraciones por defecto
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Guardar configuraciones
  const saveSettings = useCallback(async (newSettings: Partial<AISettings>) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const { error: upsertError } = await supabase
        .from('ai_settings')
        .upsert({
          user_id: user.id,
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        });

      if (upsertError) throw upsertError;

      setSettings(updatedSettings);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error guardando configuraciones');
    } finally {
      setLoading(false);
    }
  }, [user, settings]);

  // Resetear a configuraciones por defecto
  const resetSettings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('ai_settings')
        .upsert({
          user_id: user.id,
          settings: defaultSettings,
          updated_at: new Date().toISOString()
        });

      if (upsertError) throw upsertError;

      setSettings(defaultSettings);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error reseteando configuraciones');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Actualizar una configuración específica
  const updateSetting = useCallback(async <K extends keyof AISettings>(
    key: K,
    value: AISettings[K]
  ) => {
    await saveSettings({ [key]: value });
  }, [saveSettings]);

  // Cargar configuraciones al montar el componente
  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user, loadSettings]);

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
    resetSettings,
    updateSetting
  };
};
