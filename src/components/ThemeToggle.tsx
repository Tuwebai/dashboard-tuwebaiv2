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
  variant = 'ghost'
}) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]} 
        ${className}
        relative overflow-hidden
        transition-all duration-300 ease-in-out
        hover:scale-105 active:scale-95
        group
      `}
      aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      {/* Icono del sol */}
      <Sun 
        className={`
          absolute transition-all duration-500 ease-in-out
          ${theme === 'light' 
            ? 'rotate-0 scale-100 opacity-100' 
            : 'rotate-90 scale-0 opacity-0'
          }
        `}
        size={iconSizes[size]}
      />
      
      {/* Icono de la luna */}
      <Moon 
        className={`
          absolute transition-all duration-500 ease-in-out
          ${theme === 'dark' 
            ? 'rotate-0 scale-100 opacity-100' 
            : '-rotate-90 scale-0 opacity-0'
          }
        `}
        size={iconSizes[size]}
      />
      
      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Button>
  );
};

export default ThemeToggle;