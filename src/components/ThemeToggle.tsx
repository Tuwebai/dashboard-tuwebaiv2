import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ThemeToggleProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ 
  variant = 'outline', 
  size = 'default',
  className = '',
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={toggleTheme}
            className={`transition-all duration-300 hover:scale-105 ${className}`}
            aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            {showLabel && (
              <span className="ml-2">
                {theme === 'light' ? 'Oscuro' : 'Claro'}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Cambiar a modo {theme === 'light' ? 'oscuro' : 'claro'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
