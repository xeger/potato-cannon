import * as React from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string
  children: React.ReactNode
}

export function IconButton({ tooltip, children, className, ...props }: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            'p-1 rounded text-text-muted transition-colors',
            'hover:bg-accent/20 hover:text-accent',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            className
          )}
          {...props}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
