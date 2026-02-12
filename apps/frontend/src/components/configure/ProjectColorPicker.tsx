import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { Check, Pipette } from 'lucide-react'

const COLORS = [
  // Neutrals
  { name: 'default', value: '#f8f8f8', label: 'Default' },
  { name: 'slate', value: '#64748b', label: 'Slate' },
  // Warm colors
  { name: 'red', value: '#ef4444', label: 'Red' },
  { name: 'crimson', value: '#be123c', label: 'Crimson' },
  { name: 'orange', value: '#f97316', label: 'Orange' },
  { name: 'amber', value: '#f59e0b', label: 'Amber' },
  { name: 'gold', value: '#ca8a04', label: 'Gold' },
  { name: 'brown', value: '#a16207', label: 'Brown' },
  // Greens
  { name: 'lime', value: '#84cc16', label: 'Lime' },
  { name: 'green', value: '#22c55e', label: 'Green' },
  { name: 'emerald', value: '#10b981', label: 'Emerald' },
  { name: 'forest', value: '#15803d', label: 'Forest' },
  // Cool colors
  { name: 'teal', value: '#14b8a6', label: 'Teal' },
  { name: 'cyan', value: '#06b6d4', label: 'Cyan' },
  { name: 'sky', value: '#0ea5e9', label: 'Sky' },
  { name: 'blue', value: '#3b82f6', label: 'Blue' },
  { name: 'indigo', value: '#4f46e5', label: 'Indigo' },
  // Purples & Pinks
  { name: 'violet', value: '#8b5cf6', label: 'Violet' },
  { name: 'purple', value: '#a855f7', label: 'Purple' },
  { name: 'fuchsia', value: '#d946ef', label: 'Fuchsia' },
  { name: 'pink', value: '#ec4899', label: 'Pink' },
  { name: 'rose', value: '#fb7185', label: 'Rose' },
]

interface ProjectColorPickerProps {
  value: string | undefined
  onChange: (color: string) => void
  disabled?: boolean
}

export function ProjectColorPicker({ value, onChange, disabled }: ProjectColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const isCustomColor = value && !COLORS.some(c => c.value === value)

  const handleCustomClick = () => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map(({ name, value: colorValue, label }) => {
        const isSelected = value === colorValue || (colorValue === '#f8f8f8' && !value)

        return (
          <button
            key={name}
            type="button"
            disabled={disabled}
            onClick={() => onChange(colorValue)}
            title={label}
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-full transition-all',
              'ring-offset-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isSelected && !isCustomColor && 'ring-2 ring-accent ring-offset-2'
            )}
            style={{ backgroundColor: colorValue }}
          >
            {isSelected && !isCustomColor && (
              <Check
                className="h-4 w-4"
                style={{
                  color: colorValue === '#f8f8f8' ? '#000' : '#fff',
                  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))'
                }}
              />
            )}
          </button>
        )
      })}

      {/* Custom color picker */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleCustomClick}
        title="Custom color"
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-full transition-all',
          'ring-offset-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isCustomColor && 'ring-2 ring-accent ring-offset-2'
        )}
        style={{
          background: isCustomColor
            ? value
            : 'conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)'
        }}
      >
        {isCustomColor ? (
          <Check
            className="h-4 w-4"
            style={{
              color: '#fff',
              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))'
            }}
          />
        ) : (
          <Pipette
            className="h-3.5 w-3.5"
            style={{
              color: '#fff',
              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))'
            }}
          />
        )}
        <input
          ref={inputRef}
          type="color"
          value={value || '#3b82f6'}
          onChange={handleCustomChange}
          disabled={disabled}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </button>
    </div>
  )
}

export { COLORS }
