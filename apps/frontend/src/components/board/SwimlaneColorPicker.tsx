import { cn } from '@/lib/utils'
import { Check, RotateCcw } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

// Subtle palette - very dark with just a hint of color
const SWIMLANE_COLORS = [
  { name: 'slate', value: '#1e2530', label: 'Slate' },
  { name: 'zinc', value: '#252528', label: 'Zinc' },
  { name: 'stone', value: '#282624', label: 'Stone' },
  { name: 'red', value: '#2a1515', label: 'Red' },
  { name: 'orange', value: '#2a1a10', label: 'Orange' },
  { name: 'amber', value: '#2a2010', label: 'Amber' },
  { name: 'green', value: '#122318', label: 'Green' },
  { name: 'teal', value: '#122220', label: 'Teal' },
  { name: 'cyan', value: '#122228', label: 'Cyan' },
  { name: 'blue', value: '#141e2a', label: 'Blue' },
  { name: 'indigo', value: '#1a1830', label: 'Indigo' },
  { name: 'violet', value: '#201530', label: 'Violet' },
  { name: 'purple', value: '#241530', label: 'Purple' },
  { name: 'pink', value: '#2a1520', label: 'Pink' },
]

interface SwimlaneColorPickerProps {
  value: string | undefined
  onChange: (color: string | null) => void
  disabled?: boolean
}

export function SwimlaneColorPicker({ value, onChange, disabled }: SwimlaneColorPickerProps) {
  const isDefault = !value

  return (
    <div className="p-3 rounded-lg bg-bg-tertiary/50 border border-border">
      <div className="flex flex-wrap gap-2">
        {/* Default option - removes custom color */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(null)}
              className={cn(
                'relative flex h-8 w-8 items-center justify-center rounded-full transition-all',
                'bg-bg-tertiary border border-border',
                'ring-offset-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isDefault && 'ring-2 ring-accent ring-offset-2'
              )}
            >
              {isDefault ? (
                <Check className="h-4 w-4 text-text-primary" />
              ) : (
                <RotateCcw className="h-3 w-3 text-text-muted" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Default</p>
          </TooltipContent>
        </Tooltip>

        {/* Color swatches */}
        {SWIMLANE_COLORS.map(({ name, value: colorValue, label }) => {
          const isSelected = value === colorValue

          return (
            <Tooltip key={name}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(colorValue)}
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-full transition-all',
                    'border-2 border-white/30',
                    'ring-offset-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    isSelected && 'ring-2 ring-accent ring-offset-2'
                  )}
                  style={{ backgroundColor: colorValue }}
                >
                  {isSelected && (
                    <Check
                      className="h-4 w-4"
                      style={{
                        color: '#fff',
                        filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))'
                      }}
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{label}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

export { SWIMLANE_COLORS }
