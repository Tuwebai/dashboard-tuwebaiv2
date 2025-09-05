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
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useApp();

  // Cargar tema del usuario o detectar preferencia del sistema
  useEffect(() => {
    const loadUserTheme = async () => {
      try {
        let userTheme: 'light' | 'dark' = 'light';
        
        if (isAuthenticated && user) {
          // Cargar tema del usuario desde la base de datos
          const savedTheme = await userPreferencesService.getUserTheme(user.id);
          userTheme = savedTheme || 'light';
        } else {
          // Usuario no autenticado - cargar desde localStorage o detectar sistema
          const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
          if (savedTheme) {
            userTheme = savedTheme;
          } else {
            // Detectar preferencia del sistema
            userTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }
        }
        
        setThemeState(userTheme);
        
        if (isAuthenticated && user) {
          // Guardar tema en la base de datos
          await userPreferencesService.saveUserTheme(user.id, userTheme);
          await userPreferencesService.saveUserPreference(user.id, 'theme', 'hasSetTheme', true);
        } else {
          // Guardar en localStorage
          localStorage.setItem('theme', userTheme);
        }
      } catch (error) {
        console.error('Error loading user theme:', error);
        // Fallback a modo claro
        setThemeState('light');
      }
      setLoading(false);
    };

    loadUserTheme();
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Aplicar tema al documento con transición suave
    const root = document.documentElement;
    
    // Remover clases anteriores
    root.classList.remove('light', 'dark');
    
    // Agregar clase de transición
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    // Aplicar nuevo tema
    root.classList.add(theme);
    
    // Guardar en localStorage como fallback
    localStorage.setItem('theme', theme);
    
    // Guardar en base de datos si el usuario está autenticado
    if (isAuthenticated && user && !loading) {
      userPreferencesService.saveUserTheme(user.id, theme).catch(error => {
        console.error('Error saving user theme:', error);
      });
    }
    
    // Remover transición después de aplicar el tema
    setTimeout(() => {
      root.style.transition = '';
    }, 300);
  }, [theme, isAuthenticated, user, loading]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
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
