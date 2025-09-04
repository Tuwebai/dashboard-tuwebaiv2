import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  validateOnChange?: boolean;
  validationRules?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  };
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    className,
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    size = 'md',
    validateOnChange = true,
    validationRules,
    value,
    onChange,
    ...props 
  }, ref) => {
    const [internalError, setInternalError] = useState<string>('');
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value);

    const validateField = (val: string): string => {
      if (!validationRules) return '';
      
      if (validationRules.required && !val.trim()) {
        return 'Este campo es obligatorio';
      }
      
      if (validationRules.minLength && val.length < validationRules.minLength) {
        return `Mínimo ${validationRules.minLength} caracteres`;
      }
      
      if (validationRules.maxLength && val.length > validationRules.maxLength) {
        return `Máximo ${validationRules.maxLength} caracteres`;
      }
      
      if (validationRules.pattern && !validationRules.pattern.test(val)) {
        return 'Formato inválido';
      }
      
      if (validationRules.custom) {
        return validationRules.custom(val) || '';
      }
      
      return '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setHasValue(!!newValue);
      
      if (validateOnChange && validationRules) {
        const validationError = validateField(newValue);
        setInternalError(validationError);
      }
      
      onChange?.(e);
    };

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => {
      setIsFocused(false);
      if (validationRules) {
        const validationError = validateField(value as string || '');
        setInternalError(validationError);
      }
    };

    const displayError = error || internalError;
    const hasError = !!displayError;

    const baseStyles = "flex w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1";
    
    const variants = {
      default: "bg-background border-input hover:border-primary/50 focus:border-primary",
      filled: "bg-muted border-muted hover:border-primary/50 focus:border-primary",
      outlined: "bg-transparent border-2 border-input hover:border-primary/50 focus:border-primary"
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-base",
      lg: "h-12 px-5 text-lg"
    };

    const errorStyles = hasError ? "border-destructive focus:ring-destructive" : "focus:ring-primary";

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
            {validationRules?.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={cn(
              baseStyles,
              variants[variant],
              sizes[size],
              errorStyles,
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
          
          {/* Focus Indicator */}
          <div className={cn(
            "absolute inset-0 rounded-lg border-2 border-primary opacity-0 transition-opacity duration-200 pointer-events-none",
            isFocused && "opacity-100"
          )} />
        </div>
        
        {/* Error Message */}
        {hasError && (
          <div className="flex items-center gap-2 text-sm text-destructive animate-in slide-in-from-top-1 duration-200">
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {displayError}
          </div>
        )}
        
        {/* Helper Text */}
        {helperText && !hasError && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

// Form Container Component
export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit?: (data: FormData) => void | Promise<void>;
  loading?: boolean;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, onSubmit, loading = false, children, ...props }, ref) => {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (loading) return;
      
      const formData = new FormData(e.currentTarget);
      await onSubmit?.(formData);
    };

    return (
      <form
        ref={ref}
        className={cn("space-y-6", className)}
        onSubmit={handleSubmit}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Procesando...</span>
            </div>
          </div>
        )}
        {children}
      </form>
    );
  }
);

Form.displayName = "Form";

export { Form, FormField };