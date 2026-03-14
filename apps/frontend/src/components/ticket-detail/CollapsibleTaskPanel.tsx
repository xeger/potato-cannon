import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Square, CheckSquare, Loader2, XCircle, MessageSquare } from 'lucide-react'
import { api } from '@/api/client'
import { TaskList } from './TaskList'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { renderMarkdown } from '@/lib/markdown'
import type { Task, TaskComment } from '@potato-cannon/shared'

interface CollapsibleTaskPanelProps {
  projectId: string
  ticketId: string
  currentPhase: string
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckSquare className="h-4 w-4 text-accent shrink-0" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-destructive shrink-0" />
    case 'in_progress':
      return <Loader2 className="h-4 w-4 text-accent shrink-0 animate-spin" />
    default:
      return <Square className="h-4 w-4 text-text-muted shrink-0" />
  }
}

const proseClasses = [
  'prose prose-sm prose-invert max-w-none text-text-secondary overflow-x-auto',
  '[&_p]:my-3 [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-0.5',
  '[&_a]:text-accent [&_a]:no-underline hover:[&_a]:underline',
  '[&_code]:bg-bg-tertiary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:border [&_code]:border-border [&_code]:text-xs',
  '[&_pre]:bg-bg-tertiary [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:overflow-x-auto [&_pre]:my-3',
  '[&_pre_code]:border-0 [&_pre_code]:p-0 [&_pre_code]:bg-transparent',
  '[&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-text-primary [&_h1]:mt-5 [&_h1]:mb-2',
  '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-text-primary [&_h2]:mt-4 [&_h2]:mb-2',
  '[&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-text-primary [&_h3]:mt-3 [&_h3]:mb-1',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:bg-bg-tertiary/50 [&_blockquote]:py-2 [&_blockquote]:pr-4 [&_blockquote]:rounded-r',
  '[&_table]:w-full [&_th]:text-left [&_th]:p-2 [&_th]:border-b [&_th]:border-border',
  '[&_td]:p-2 [&_td]:border-b [&_td]:border-border',
  '[&_strong]:text-text-primary',
].join(' ')

export function CollapsibleTaskPanel({ projectId, ticketId, currentPhase }: CollapsibleTaskPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', projectId, ticketId, currentPhase],
    queryFn: () => api.getTicketTasks(projectId, ticketId, currentPhase),
  })

  // Don't render anything while loading or if no tasks
  if (isLoading || tasks.length === 0) {
    return null
  }

  const completed = tasks.filter((t) => t.status === 'completed').length
  const total = tasks.length

  // Collapsed summary: failed > in_progress > count
  const failedTask = tasks.find((t) => t.status === 'failed')
  const inProgressTask = tasks.find((t) => t.status === 'in_progress')

  let collapsedSummary: React.ReactNode
  if (failedTask) {
    collapsedSummary = (
      <span data-testid="collapsed-summary" className="truncate text-destructive">
        {failedTask.description}
      </span>
    )
  } else if (inProgressTask) {
    collapsedSummary = (
      <span data-testid="collapsed-summary" className="truncate text-text-secondary">
        {inProgressTask.description}
      </span>
    )
  } else {
    collapsedSummary = (
      <span data-testid="collapsed-summary" className="text-text-muted">
        {completed}/{total}
      </span>
    )
  }

  return (
    <>
      <div className="border-t border-border shrink-0">
        {/* Header — always visible */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 w-full px-4 py-2 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors"
          aria-label="Tasks"
          data-testid="task-panel-header"
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>Tasks</span>
          {isExpanded ? (
            <span className="text-text-muted ml-auto">{completed}/{total}</span>
          ) : (
            <span className="ml-auto">{collapsedSummary}</span>
          )}
        </button>

        {/* Content — animated */}
        <div
          data-testid="task-panel-content"
          className="overflow-hidden transition-[max-height] duration-200 ease-in-out"
          style={{ maxHeight: isExpanded ? '200px' : '0px' }}
        >
          <div className="overflow-y-auto max-h-[200px] px-3 pb-3">
            <TaskList tasks={tasks} onTaskClick={setSelectedTask} />
          </div>
        </div>
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="bg-bg-secondary border-border sm:max-w-2xl max-h-[85vh] flex flex-col" aria-describedby="task-dialog-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTask && getStatusIcon(selectedTask.status)}
              Task #{selectedTask?.displayNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <Tabs defaultValue="details" className="min-h-0 flex flex-col">
              <TabsList className="shrink-0">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="comments">
                  Comments
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="overflow-y-auto min-h-0">
                <div id="task-dialog-description" className="space-y-4 pt-2">
                  <p className="text-sm text-text-primary leading-relaxed">{selectedTask.description}</p>
                  {selectedTask.body && (
                    <div
                      className={proseClasses}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedTask.body) }}
                    />
                  )}
                  <div className="flex items-center gap-2 text-xs text-text-muted pt-2 border-t border-border">
                    <Badge variant="outline">{selectedTask.status}</Badge>
                    <span>Attempt {selectedTask.attemptCount}</span>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="comments" className="overflow-y-auto min-h-0">
                <TaskComments projectId={projectId} ticketId={ticketId} taskId={selectedTask.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function TaskComments({ projectId, ticketId, taskId }: { projectId: string; ticketId: string; taskId: string }) {
  const { data: comments = [], isLoading } = useQuery<TaskComment[]>({
    queryKey: ['task-comments', projectId, ticketId, taskId],
    queryFn: () => api.getTaskComments(projectId, ticketId, taskId),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-text-muted">
        <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No comments yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-2">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-md border border-border bg-bg-primary p-4">
          <div
            className={proseClasses}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.text) }}
          />
          <p className="text-xs text-text-muted mt-3 pt-2 border-t border-border">
            {new Date(comment.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}
