import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    children, 
    ...props 
  }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden";
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary shadow-sm hover:shadow-md active:scale-95",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary shadow-sm hover:shadow-md active:scale-95",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive shadow-sm hover:shadow-md active:scale-95",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-ring shadow-sm hover:shadow-md active:scale-95",
      ghost: "hover:bg-accent hover:text-accent-foreground focus:ring-ring active:scale-95",
      link: "text-primary underline-offset-4 hover:underline focus:ring-primary"
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-base",
      lg: "h-12 px-6 text-lg",
      xl: "h-14 px-8 text-xl"
    };

    const widthStyles = fullWidth ? "w-full" : "";

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          widthStyles,
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
        
        {/* Content */}
        <div className={cn("flex items-center gap-2", loading && "opacity-0")}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </div>

        {/* Ripple Effect */}
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-white/20 scale-0 transition-transform duration-300 group-hover:scale-100" />
        </div>
      </button>
    );
  }
);

Button.displayName = "Button";

// Export button variants for external use
export const buttonVariants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary shadow-sm hover:shadow-md active:scale-95",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary shadow-sm hover:shadow-md active:scale-95",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive shadow-sm hover:shadow-md active:scale-95",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-ring shadow-sm hover:shadow-md active:scale-95",
  ghost: "hover:bg-accent hover:text-accent-foreground focus:ring-ring active:scale-95",
  link: "text-primary underline-offset-4 hover:underline focus:ring-primary"
};

export const buttonSizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-6 text-lg",
  xl: "h-14 px-8 text-xl"
};

export { Button };