import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  hover?: boolean;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default', 
    hover = true,
    interactive = false,
    padding = 'md',
    children, 
    ...props 
  }, ref) => {
    const baseStyles = "rounded-xl border transition-all duration-300 relative overflow-hidden";
    
    const variants = {
      default: "bg-card text-card-foreground border-border shadow-sm",
      elevated: "bg-card text-card-foreground border-border shadow-lg",
      outlined: "bg-card text-card-foreground border-2 border-border shadow-none",
      glass: "bg-card/80 backdrop-blur-sm text-card-foreground border-border/50 shadow-lg"
    };

    const paddingStyles = {
      none: "",
      sm: "p-3",
      md: "p-6",
      lg: "p-8",
      xl: "p-10"
    };

    const hoverStyles = hover ? "hover:shadow-xl hover:-translate-y-1" : "";
    const interactiveStyles = interactive ? "cursor-pointer" : "";

    return (
      <div
        className={cn(
          baseStyles,
          variants[variant],
          paddingStyles[padding],
          hoverStyles,
          interactiveStyles,
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Gradient Overlay for Hover Effect */}
        {hover && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 transition-opacity duration-300 hover:opacity-100 pointer-events-none" />
        )}
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Subtle Border Glow */}
        <div className="absolute inset-0 rounded-xl border border-primary/10 opacity-0 transition-opacity duration-300 hover:opacity-100 pointer-events-none" />
      </div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 pb-4", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-4", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };