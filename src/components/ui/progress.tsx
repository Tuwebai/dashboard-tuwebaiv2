import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    color?: 'primary' | 'gold' | 'neon' | 'danger';
  }
>(({ className, value, color = 'primary', ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full flex-1 transition-all",
        color === 'primary' && 'bg-gradient-to-r from-blue-500 via-violet-600 to-blue-400',
        color === 'gold' && 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600',
        color === 'neon' && 'bg-gradient-to-r from-green-400 via-green-500 to-green-400',
        color === 'danger' && 'bg-gradient-to-r from-red-600 to-pink-600'
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
