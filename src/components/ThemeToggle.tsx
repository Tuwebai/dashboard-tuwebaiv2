import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'outline'
}) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'h-8 w-16',
    md: 'h-9 w-18',
    lg: 'h-10 w-20'
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18
  };

  return (
    <Button
      variant={variant}
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]} 
        ${className}
        relative overflow-hidden
        transition-all duration-300 ease-in-out
        hover:scale-105 active:scale-95
        group
        bg-slate-200 dark:bg-slate-700
        border-slate-300 dark:border-slate-600
        hover:bg-slate-300 dark:hover:bg-slate-600
        hover:border-slate-400 dark:hover:border-slate-500
        rounded-full
        p-1
      `}
      aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      {/* Fondo deslizante */}
      <div 
        className={`
          absolute top-1 bottom-1 w-7 rounded-full
          transition-all duration-300 ease-in-out
          ${theme === 'light' 
            ? 'left-1 bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg' 
            : 'right-1 bg-gradient-to-r from-slate-600 to-slate-700 shadow-lg'
          }
        `}
      />
      
      {/* Icono del sol */}
      <div 
        className={`
          absolute top-1/2 -translate-y-1/2
          transition-all duration-300 ease-in-out
          ${theme === 'light' 
            ? 'left-1.5 opacity-100 scale-100' 
            : 'left-1.5 opacity-60 scale-90'
          }
        `}
      >
        <Sun 
          className={`
            transition-colors duration-300
            ${theme === 'light' 
              ? 'text-white drop-shadow-sm' 
              : 'text-slate-500 dark:text-slate-400'
            }
          `}
          size={iconSizes[size]}
        />
      </div>
      
      {/* Icono de la luna */}
      <div 
        className={`
          absolute top-1/2 -translate-y-1/2
          transition-all duration-300 ease-in-out
          ${theme === 'dark' 
            ? 'right-1.5 opacity-100 scale-100' 
            : 'right-1.5 opacity-60 scale-90'
          }
        `}
      >
        <Moon 
          className={`
            transition-colors duration-300
            ${theme === 'dark' 
              ? 'text-white drop-shadow-sm' 
              : 'text-slate-500 dark:text-slate-400'
            }
          `}
          size={iconSizes[size]}
        />
      </div>
      
      {/* Efecto de brillo sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
    </Button>
  );
};

export default ThemeToggle;