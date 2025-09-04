import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useApp } from './AppContext';
import { userPreferencesService } from '@/lib/userPreferencesService';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // SIEMPRE FORZAR MODO CLARO - NO DETECTAR MODO DEL SISTEMA
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useApp();

  // SIEMPRE MODO CLARO - IGNORAR PREFERENCIAS DEL SISTEMA
  useEffect(() => {
    const loadUserTheme = async () => {
      // FORZAR SIEMPRE MODO CLARO
      setThemeState('light');
      
      if (isAuthenticated && user) {
        try {
          // Guardar tema claro en la base de datos
          await userPreferencesService.saveUserTheme(user.id, 'light');
          await userPreferencesService.saveUserPreference(user.id, 'theme', 'hasSetTheme', true);
        } catch (error) {
          // console.error('Error saving user theme:', error);
        }
      } else {
        // Usuario no autenticado - forzar tema claro en localStorage
        localStorage.setItem('theme', 'light');
      }
      setLoading(false);
    };

    loadUserTheme();
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Aplicar tema al documento
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Guardar en localStorage como fallback
    localStorage.setItem('theme', theme);
    
    // Guardar en base de datos si el usuario está autenticado
    if (isAuthenticated && user && !loading) {
      userPreferencesService.saveUserTheme(user.id, theme).catch(error => {
        console.error('Error saving user theme:', error);
      });
    }
  }, [theme, isAuthenticated, user, loading]);

  const toggleTheme = () => {
    // DESHABILITADO - SIEMPRE MODO CLARO
    // setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    // FORZAR SIEMPRE MODO CLARO - IGNORAR PARÁMETRO
    setThemeState('light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
