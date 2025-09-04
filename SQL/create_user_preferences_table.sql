-- Crear tabla para preferencias del usuario
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preference_type TEXT NOT NULL CHECK (preference_type IN ('theme', 'dashboard_widgets', 'dashboard_layouts', 'language', 'welcome_back', 'auth_state')),
    preference_key TEXT NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices únicos para evitar duplicados
    UNIQUE(user_id, preference_type, preference_key)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_type ON public.user_preferences(preference_type);
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at ON public.user_preferences(updated_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Política RLS: Los usuarios solo pueden ver sus propias preferencias
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- Política RLS: Los usuarios solo pueden insertar sus propias preferencias
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política RLS: Los usuarios solo pueden actualizar sus propias preferencias
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Política RLS: Los usuarios solo pueden eliminar sus propias preferencias
CREATE POLICY "Users can delete own preferences" ON public.user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Política RLS: Los administradores pueden ver todas las preferencias
CREATE POLICY "Admins can view all preferences" ON public.user_preferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON public.user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE public.user_preferences IS 'Almacena las preferencias personalizadas de cada usuario';
COMMENT ON COLUMN public.user_preferences.user_id IS 'ID del usuario propietario de la preferencia';
COMMENT ON COLUMN public.user_preferences.preference_type IS 'Tipo de preferencia: theme, dashboard_widgets, dashboard_layouts, language, welcome_back, auth_state';
COMMENT ON COLUMN public.user_preferences.preference_key IS 'Clave específica de la preferencia';
COMMENT ON COLUMN public.user_preferences.preference_value IS 'Valor de la preferencia en formato JSON';
