import React from 'react';
import { Loader2, RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'ring';
  text?: string;
  className?: string;
}

interface LoadingStateProps {
  state: 'loading' | 'success' | 'error' | 'idle';
  text?: string;
  className?: string;
}

interface ProgressSpinnerProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

// Spinner principal con diferentes variantes
export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  text, 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'bg-current rounded-full animate-bounce',
                  sizeClasses[size]
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className={cn(
            'bg-current rounded-full animate-pulse',
            sizeClasses[size]
          )} />
        );

      case 'ring':
        return (
          <div className={cn(
            'border-2 border-current border-t-transparent rounded-full animate-spin',
            sizeClasses[size]
          )} />
        );

      default:
        return (
          <Loader2 className={cn(
            'animate-spin',
            sizeClasses[size]
          )} />
        );
    }
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-2',
      className
    )}>
      {renderSpinner()}
      {text && (
        <p className="text-sm text-slate-600 text-center">
          {text}
        </p>
      )}
    </div>
  );
}

// Spinner con estado (loading, success, error)
export function LoadingState({ 
  state, 
  text, 
  className = '' 
}: LoadingStateProps) {
  const getStateContent = () => {
    switch (state) {
      case 'loading':
        return {
          icon: <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />,
          text: text || 'Cargando...',
          color: 'text-blue-600'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          text: text || 'Completado',
          color: 'text-green-600'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-600" />,
          text: text || 'Error',
          color: 'text-red-600'
        };
      case 'idle':
        return {
          icon: <Clock className="w-6 h-6 text-slate-400" />,
          text: text || 'En espera',
          color: 'text-slate-400'
        };
    }
  };

  const content = getStateContent();

  return (
    <div className={cn(
      'flex items-center gap-2',
      className
    )}>
      {content.icon}
      <span className={cn('text-sm font-medium', content.color)}>
        {content.text}
      </span>
    </div>
  );
}

// Spinner con barra de progreso
export function ProgressSpinner({ 
  progress, 
  size = 'md', 
  text, 
  className = '' 
}: ProgressSpinnerProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 6;
  const radius = size === 'sm' ? 26 : size === 'md' ? 38 : 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn(
      'flex flex-col items-center gap-3',
      className
    )}>
      <div className="relative">
        <svg
          className={cn('transform -rotate-90', sizeClasses[size])}
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-200"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-blue-600 transition-all duration-300 ease-in-out"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-slate-700">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      {text && (
        <p className="text-sm text-slate-600 text-center">
          {text}
        </p>
      )}
    </div>
  );
}

// Spinner para botones
export function ButtonSpinner({ 
  size = 'sm', 
  className = '' 
}: { 
  size?: 'sm' | 'md'; 
  className?: string; 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  };

  return (
    <Loader2 className={cn(
      'animate-spin',
      sizeClasses[size],
      className
    )} />
  );
}

// Spinner para páginas completas
export function PageSpinner({ 
  text = 'Cargando página...',
  className = '' 
}: { 
  text?: string; 
  className?: string; 
}) {
  return (
    <div className={cn(
      'min-h-screen flex flex-col items-center justify-center gap-4',
      className
    )}>
      <LoadingSpinner size="xl" variant="ring" />
      <p className="text-lg text-slate-600 font-medium">
        {text}
      </p>
    </div>
  );
}

// Spinner para secciones
export function SectionSpinner({ 
  text = 'Cargando...',
  className = '' 
}: { 
  text?: string; 
  className?: string; 
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 gap-3',
      className
    )}>
      <LoadingSpinner size="lg" variant="default" />
      <p className="text-base text-slate-600">
        {text}
      </p>
    </div>
  );
}

// Spinner para listas
export function ListSpinner({ 
  text = 'Cargando elementos...',
  className = '' 
}: { 
  text?: string; 
  className?: string; 
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-8 gap-2',
      className
    )}>
      <LoadingSpinner size="md" variant="dots" />
      <p className="text-sm text-slate-500">
        {text}
      </p>
    </div>
  );
}

// Spinner para formularios
export function FormSpinner({ 
  text = 'Guardando...',
  className = '' 
}: { 
  text?: string; 
  className?: string; 
}) {
  return (
    <div className={cn(
      'flex items-center gap-2 text-sm text-slate-600',
      className
    )}>
      <ButtonSpinner size="sm" />
      <span>{text}</span>
    </div>
  );
}

export default LoadingSpinner; 
