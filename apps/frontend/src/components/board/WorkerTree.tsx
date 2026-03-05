import { Loader2, Bot } from 'lucide-react'
import { usePhaseWorkers } from '@/hooks/queries'
import { WorkerTreeItem } from './WorkerTreeItem'
import type { WorkerNode } from '@potato-cannon/shared'

interface WorkerTreeProps {
  projectId: string
  phase: string
  onAgentClick: (agentType: string, agentName: string, model?: string) => void
  filter?: (worker: WorkerNode) => boolean
  emptyMessage?: string
}

export function WorkerTree({ projectId, phase, onAgentClick, filter, emptyMessage }: WorkerTreeProps) {
  const { data, isLoading, error } = usePhaseWorkers(projectId, phase)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-xs text-accent-red py-2">
        Failed to load workers
      </div>
    )
  }

  const workers = filter && data?.workers
    ? data.workers.filter(filter)
    : data?.workers ?? []

  if (workers.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-text-muted">
        <Bot className="h-4 w-4" />
        <span className="text-xs">{emptyMessage ?? 'No workers configured for this phase'}</span>
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {workers.map((worker, index) => (
        <WorkerTreeItem
          key={worker.id}
          node={worker}
          depth={0}
          isLastChild={index === workers.length - 1}
          onAgentClick={onAgentClick}
        />
      ))}
    </div>
  )
}

/** Check if a phase has an answerBot worker */
export function useHasAnswerBot(projectId: string, phase: string): boolean {
  const { data } = usePhaseWorkers(projectId, phase)
  return data?.workers?.some(w => w.type === 'answerBot') ?? false
}
