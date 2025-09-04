import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaInvalid?: boolean
  ariaRequired?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ariaLabel, ariaDescribedBy, ariaInvalid, ariaRequired, ...props }, ref) => {
    // Mejorar accesibilidad con ARIA labels y descripciones
    const accessibilityProps = {
      ...(ariaLabel && { "aria-label": ariaLabel }),
      ...(ariaDescribedBy && { "aria-describedby": ariaDescribedBy }),
      ...(ariaInvalid !== undefined && { "aria-invalid": ariaInvalid }),
      ...(ariaRequired !== undefined && { "aria-required": ariaRequired }),
      // Asegurar que el textarea sea accesible por teclado
      tabIndex: props.tabIndex ?? 0,
    }

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
Textarea.displayName = "Textarea"

export { Textarea }
