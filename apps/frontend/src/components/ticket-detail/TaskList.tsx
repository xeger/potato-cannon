import { Square, CheckSquare } from 'lucide-react'
import type { Task } from '@potato-cannon/shared'

interface TaskListProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

export function TaskList({ tasks, onTaskClick }: TaskListProps) {
  if (tasks.length === 0) {
    return null
  }

  return (
    <div className="px-4 pb-4">
      <div className="rounded-lg border border-border bg-bg-secondary p-3 max-h-[200px] overflow-y-auto shadow-sm">
        <div className="text-xs font-medium text-text-secondary mb-2">Tasks</div>
        <ul className="space-y-1">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-2 cursor-pointer hover:bg-bg-primary/50 p-1 rounded transition-colors"
              onClick={() => onTaskClick?.(task)}
              data-testid={`task-item-${task.id}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onTaskClick?.(task)}
            >
              {task.status === 'completed' ? (
                <CheckSquare className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              ) : (
                <Square className="h-4 w-4 text-text-muted shrink-0 mt-0.5" />
              )}
              <span className={`text-sm ${task.status === 'completed' ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                {task.description}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
