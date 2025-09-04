import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

interface PasswordValidatorProps {
  password: string;
  onPasswordChange: (password: string) => void;
  showPassword?: boolean;
  onToggleShowPassword?: () => void;
  className?: string;
}

interface PasswordRequirement {
  id: string;
  text: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  {
    id: 'length',
    text: 'Mínimo 8 caracteres',
    test: (password) => password.length >= 8
  },
  {
    id: 'uppercase',
    text: 'Al menos una mayúscula',
    test: (password) => /[A-Z]/.test(password)
  },
  {
    id: 'lowercase',
    text: 'Al menos una minúscula',
    test: (password) => /[a-z]/.test(password)
  },
  {
    id: 'number',
    text: 'Al menos un número',
    test: (password) => /\d/.test(password)
  },
  {
    id: 'special',
    text: 'Al menos un símbolo especial',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
];

export default function PasswordValidator({ 
  password, 
  onPasswordChange, 
  showPassword = false,
  onToggleShowPassword,
  className = ''
}: PasswordValidatorProps) {
  const [focused, setFocused] = useState(false);
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    const validRequirements = requirements.filter(req => req.test(password));
    const strengthPercentage = (validRequirements.length / requirements.length) * 100;
    setStrength(strengthPercentage);
  }, [password]);

  const getStrengthColor = () => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 70) return 'bg-yellow-500';
    if (strength < 100) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (strength < 40) return 'Débil';
    if (strength < 70) return 'Media';
    if (strength < 100) return 'Fuerte';
    return 'Muy Fuerte';
  };

  const getStrengthTextColor = () => {
    if (strength < 40) return 'text-red-600';
    if (strength < 70) return 'text-yellow-600';
    if (strength < 100) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input de contraseña */}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ingresa tu contraseña"
          className="w-full px-3 py-2 pr-10 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input text-foreground"
        />
        {onToggleShowPassword && (
          <button
            type="button"
            onClick={onToggleShowPassword}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Indicador de fortaleza */}
      {password && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Fortaleza de la contraseña:</span>
            <span className={`text-sm font-semibold ${getStrengthTextColor()}`}>
              {getStrengthText()}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getStrengthColor()} transition-all duration-300`}
              style={{ width: `${strength}%` }}
            />
          </div>
        </div>
      )}

      {/* Lista de requisitos */}
      {(focused || password) && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Requisitos de seguridad:</p>
          <div className="space-y-1">
            {requirements.map((requirement) => {
              const isValid = requirement.test(password);
              return (
                <div
                  key={requirement.id}
                  className="flex items-center gap-2 text-sm"
                >
                  {isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-300" />
                  )}
                  <span className={isValid ? 'text-green-700' : 'text-gray-500'}>
                    {requirement.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Información de seguridad */}
      {password && strength >= 100 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              ¡Excelente! Tu contraseña cumple con todos los requisitos de seguridad.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
