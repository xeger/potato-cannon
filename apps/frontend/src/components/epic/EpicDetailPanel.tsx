import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { X, ExternalLink } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useEpic, useUpdateEpic, useDeleteEpic } from '@/hooks/queries'
import { EpicProgressBar } from './EpicProgressBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { EpicStatus } from '@potato-cannon/shared'

const STATUS_STYLES: Record<EpicStatus, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'bg-zinc-500/20 text-zinc-400' },
  in_progress: { label: 'In Progress', className: 'bg-blue-500/20 text-blue-400' },
  complete: { label: 'Complete', className: 'bg-green-500/20 text-green-400' },
}

export function EpicDetailPanel() {
  const epicSheetOpen = useAppStore((s) => s.epicSheetOpen)
  const epicSheetEpicId = useAppStore((s) => s.epicSheetEpicId)
  const epicSheetProjectId = useAppStore((s) => s.epicSheetProjectId)
  const closeEpicSheet = useAppStore((s) => s.closeEpicSheet)
  const openTicketSheet = useAppStore((s) => s.openTicketSheet)
  const currentProjectId = useAppStore((s) => s.currentProjectId)

  const location = useLocation()
  const navigate = useNavigate()

  const isOnEpicsView = !!location.pathname.match(/^\/projects\/[^/]+\/epics/)
  const isOnBoardView = !!location.pathname.match(/^\/projects\/[^/]+\/board/)
  const isCorrectProject = currentProjectId === epicSheetProjectId
  const isOpen = epicSheetOpen && (isOnEpicsView || isOnBoardView) && isCorrectProject

  const { data: epic } = useEpic(epicSheetProjectId, epicSheetEpicId)
  const updateEpic = useUpdateEpic()
  const deleteEpic = useDeleteEpic()

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [editingDescription, setEditingDescription] = useState(false)
  const [descriptionValue, setDescriptionValue] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Sync title/description when epic data changes
  useEffect(() => {
    if (epic) {
      setTitleValue(epic.title)
      setDescriptionValue(epic.description || '')
    }
  }, [epic?.id, epic?.title, epic?.description])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return

      const openDialog = document.querySelector('[data-slot="dialog-content"][data-state="open"]')
      if (openDialog) return

      const activeElement = document.activeElement
      if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
        activeElement.blur()
        return
      }

      closeEpicSheet()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeEpicSheet])

  const handleSaveTitle = useCallback(() => {
    if (!epicSheetProjectId || !epicSheetEpicId || !titleValue.trim()) return
    updateEpic.mutate({
      projectId: epicSheetProjectId,
      epicId: epicSheetEpicId,
      updates: { title: titleValue.trim() },
    })
    setEditingTitle(false)
  }, [epicSheetProjectId, epicSheetEpicId, titleValue, updateEpic])

  const handleSaveDescription = useCallback(() => {
    if (!epicSheetProjectId || !epicSheetEpicId) return
    updateEpic.mutate({
      projectId: epicSheetProjectId,
      epicId: epicSheetEpicId,
      updates: { description: descriptionValue.trim() || undefined },
    })
    setEditingDescription(false)
  }, [epicSheetProjectId, epicSheetEpicId, descriptionValue, updateEpic])

  const handleDelete = useCallback(() => {
    if (!epicSheetProjectId || !epicSheetEpicId) return
    deleteEpic.mutate(
      { projectId: epicSheetProjectId, epicId: epicSheetEpicId },
      {
        onSuccess: () => {
          setDeleteConfirmOpen(false)
          closeEpicSheet()
        },
      }
    )
  }, [epicSheetProjectId, epicSheetEpicId, deleteEpic, closeEpicSheet])

  const handleTicketClick = useCallback(
    (ticketId: string) => {
      if (!epicSheetProjectId) return
      const projectSlug = location.pathname.match(/^\/projects\/([^/]+)/)?.[1]
      if (projectSlug) {
        navigate({ to: '/projects/$projectId/board', params: { projectId: projectSlug } })
        setTimeout(() => {
          openTicketSheet(epicSheetProjectId, ticketId)
        }, 100)
      }
    },
    [epicSheetProjectId, location.pathname, navigate, openTicketSheet]
  )

  const statusStyle = epic ? STATUS_STYLES[epic.status] : STATUS_STYLES.not_started

  return (
    <>
      <div className="epic-detail-panel" data-open={isOpen}>
        <div className="flex flex-col h-full w-[480px] max-w-full">
          {epic && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between p-4 border-b border-border">
                <div className="flex-1 min-w-0 mr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-text-muted">{epic.identifier}</span>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', statusStyle.className)}>
                      {statusStyle.label}
                    </span>
                  </div>

                  {editingTitle ? (
                    <Input
                      value={titleValue}
                      onChange={(e) => setTitleValue(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle()
                        if (e.key === 'Escape') {
                          setTitleValue(epic.title)
                          setEditingTitle(false)
                        }
                      }}
                      autoFocus
                      className="text-sm font-medium"
                    />
                  ) : (
                    <h2
                      className="text-sm font-medium text-text-primary cursor-pointer hover:text-accent transition-colors"
                      onClick={() => setEditingTitle(true)}
                    >
                      {epic.title}
                    </h2>
                  )}
                </div>

                <button
                  onClick={closeEpicSheet}
                  className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Progress */}
                <div>
                  <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Progress</h3>
                  <EpicProgressBar doneCount={epic.doneCount} totalCount={epic.ticketCount} />
                  <p className="text-xs text-text-muted mt-1">
                    {epic.doneCount}/{epic.ticketCount} tickets done
                  </p>
                </div>

                {/* Phase Breakdown */}
                {Object.keys(epic.phaseBreakdown).length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">By Phase</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(epic.phaseBreakdown).map(([phase, count]) => (
                        <span
                          key={phase}
                          className="text-xs px-2 py-1 rounded bg-bg-tertiary text-text-secondary"
                        >
                          {phase}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Description</h3>
                  {editingDescription ? (
                    <div>
                      <Textarea
                        value={descriptionValue}
                        onChange={(e) => setDescriptionValue(e.target.value)}
                        className="min-h-[120px] resize-y text-sm"
                        placeholder="Shared context for agents working on child tickets..."
                      />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={handleSaveDescription}>Save</Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDescriptionValue(epic.description || '')
                            setEditingDescription(false)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-colors min-h-[40px] p-2 rounded border border-transparent hover:border-border"
                      onClick={() => setEditingDescription(true)}
                    >
                      {epic.description || (
                        <span className="text-text-muted italic">Click to add description...</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Child Tickets */}
                <div>
                  <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    Tickets ({epic.tickets?.length || 0})
                  </h3>
                  {epic.tickets && epic.tickets.length > 0 ? (
                    <div className="space-y-1">
                      {epic.tickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          type="button"
                          onClick={() => handleTicketClick(ticket.id)}
                          className="w-full flex items-center gap-2 p-2 rounded hover:bg-bg-hover transition-colors text-left group"
                        >
                          <span className="text-xs font-mono text-text-muted">{ticket.id}</span>
                          <span className="text-sm text-text-primary flex-1 truncate">{ticket.title}</span>
                          <span className="text-xs text-text-muted">{ticket.phase}</span>
                          <ExternalLink className="h-3 w-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted italic">No tickets assigned.</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-accent-red hover:text-accent-red"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  Delete Epic
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Epic?</DialogTitle>
            <DialogDescription>
              This will delete the epic. Child tickets will be unlinked but not deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteEpic.isPending}
            >
              {deleteEpic.isPending ? 'Deleting...' : 'Delete Epic'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
