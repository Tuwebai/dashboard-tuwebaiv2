import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaInvalid?: boolean
  ariaRequired?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ariaLabel, ariaDescribedBy, ariaInvalid, ariaRequired, ...props }, ref) => {
    // Mejorar accesibilidad con ARIA labels y descripciones
    const accessibilityProps = {
      ...(ariaLabel && { "aria-label": ariaLabel }),
      ...(ariaDescribedBy && { "aria-describedby": ariaDescribedBy }),
      ...(ariaInvalid !== undefined && { "aria-invalid": ariaInvalid }),
      ...(ariaRequired !== undefined && { "aria-required": ariaRequired }),
      // Asegurar que el input sea accesible por teclado
      tabIndex: props.tabIndex ?? 0,
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...accessibilityProps}
        {...props}
        // Mejorar navegación por teclado
        onKeyDown={(e) => {
          // Permitir navegación por teclado estándar
          if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            return // Permitir navegación estándar
          }
          
          // Llamar al onKeyDown original si existe
          if (props.onKeyDown) {
            props.onKeyDown(e)
          }
        }}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
