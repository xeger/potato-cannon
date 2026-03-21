interface EpicProgressBarProps {
  doneCount: number
  totalCount: number
}

export function EpicProgressBar({ doneCount, totalCount }: EpicProgressBarProps) {
  const percentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: percentage === 100 ? 'var(--color-accent-green)' : 'var(--color-accent)',
          }}
        />
      </div>
      <span className="text-xs text-text-muted tabular-nums">{percentage}%</span>
    </div>
  )
}
