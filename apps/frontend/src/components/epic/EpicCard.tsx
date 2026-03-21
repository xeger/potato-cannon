import type { EpicWithCounts, EpicStatus } from '@potato-cannon/shared'
import { EpicProgressBar } from './EpicProgressBar'
import { cn } from '@/lib/utils'

interface EpicCardProps {
  epic: EpicWithCounts
  onClick: () => void
  isSelected?: boolean
}

const STATUS_STYLES: Record<EpicStatus, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'bg-zinc-500/20 text-zinc-400' },
  in_progress: { label: 'In Progress', className: 'bg-blue-500/20 text-blue-400' },
  complete: { label: 'Complete', className: 'bg-green-500/20 text-green-400' },
}

export function EpicCard({ epic, onClick, isSelected }: EpicCardProps) {
  const statusStyle = STATUS_STYLES[epic.status]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-colors',
        'hover:bg-bg-hover',
        isSelected
          ? 'border-accent bg-bg-tertiary'
          : 'border-border bg-bg-secondary'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-mono text-text-muted">{epic.identifier}</span>
        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', statusStyle.className)}>
          {statusStyle.label}
        </span>
      </div>

      <h3 className="text-sm font-medium text-text-primary mb-2 line-clamp-2">
        {epic.title}
      </h3>

      {epic.description && (
        <p className="text-xs text-text-muted mb-3 line-clamp-2">
          {epic.description}
        </p>
      )}

      <EpicProgressBar doneCount={epic.doneCount} totalCount={epic.ticketCount} />

      <div className="mt-2 text-xs text-text-muted">
        {epic.doneCount}/{epic.ticketCount} tickets done
      </div>
    </button>
  )
}
