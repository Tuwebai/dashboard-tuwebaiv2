import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  glow?: boolean;
}

export default function Logo({ size = 'md', showText = true, className = '', glow = true }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/logoweb.jpg" 
        alt="TuWebAI Logo" 
        className={`${sizeClasses[size]} object-contain ${glow ? 'animate-avatar-glow' : ''}`}
      />
      
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent ${textSizes[size]}`}>
          TuWebAI
        </span>
      )}
    </div>
  );
} 
