import { useState, useCallback } from 'react'
import { AlertTriangle, Trash2, Loader2, Archive } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteTicket, useArchiveTicket } from '@/hooks/queries'
import { ArchiveConfirmDialog, shouldShowArchiveWarning } from './ArchiveConfirmDialog'
import { useAppStore } from '@/stores/appStore'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface SettingsTabProps {
  projectId: string
  ticketId: string
  ticket: {
    phase: string
    archived?: boolean
  }
  onDeleted: () => void
  onArchived?: () => void
}

export function SettingsTab({ projectId, ticketId, ticket, onDeleted, onArchived }: SettingsTabProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)
  const deleteTicket = useDeleteTicket()
  const archiveTicket = useArchiveTicket()
  const addArchivingTicket = useAppStore((s) => s.addArchivingTicket)
  const removeArchivingTicket = useAppStore((s) => s.removeArchivingTicket)
  const closeTicketSheet = useAppStore((s) => s.closeTicketSheet)

  const handleArchiveClick = () => {
    if (shouldShowArchiveWarning()) {
      setArchiveConfirmOpen(true)
    } else {
      handleArchive()
    }
  }

  const handleArchive = () => {
    // 1. Mark as archiving BEFORE mutation
    addArchivingTicket(projectId, ticketId)

    // 2. Close sheet immediately so user sees card on board
    closeTicketSheet()

    // 3. Execute mutation
    archiveTicket.mutate(
      { projectId, ticketId },
      {
        onSuccess: (result) => {
          // State cleanup - card will be removed from DOM by query invalidation
          removeArchivingTicket(projectId, ticketId)
          setArchiveConfirmOpen(false)
          if (result.cleanup.errors.length > 0) {
            toast.warning('Ticket archived', {
              description: `Could not clean up: ${result.cleanup.errors.join(', ')}`
            })
          } else {
            toast.success('Ticket archived')
          }
          onArchived?.()
        },
        onError: (error) => {
          // Remove archiving state so user can retry
          removeArchivingTicket(projectId, ticketId)
          toast.error('Failed to archive ticket', {
            description: (error as Error).message
          })
        }
      }
    )
  }

  const handleDelete = useCallback(() => {
    deleteTicket.mutate(
      { projectId, ticketId },
      {
        onSuccess: () => {
          setConfirmOpen(false)
          onDeleted()
        }
      }
    )
  }, [projectId, ticketId, deleteTicket, onDeleted])

  return (
    <div className="space-y-6">
      {/* Archive Section */}
      {!ticket.archived && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Archive className="h-4 w-4 text-yellow-500" />
            <h3 className="text-sm font-medium text-yellow-500">Archive Ticket</h3>
          </div>
          <p className="text-xs text-text-secondary mb-4">
            Archiving removes the ticket from the board and cleans up any git worktrees
            and local branches. The ticket data is preserved and can be restored later.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchiveClick}
            disabled={ticket.phase !== 'Done' || archiveTicket.isPending}
          >
            <Archive className="h-3 w-3" />
            Archive Ticket
          </Button>
          {ticket.phase !== 'Done' && (
            <p className="text-xs text-text-muted mt-2">
              Only tickets in the Done column can be archived.
            </p>
          )}
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-lg border border-accent-red/20 bg-accent-red/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-accent-red" />
          <h3 className="text-sm font-medium text-accent-red">Danger Zone</h3>
        </div>
        <p className="text-xs text-text-secondary mb-4">
          Deleting a ticket is permanent and cannot be undone. All associated artifacts
          and history will be removed.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          className="bg-accent-red hover:bg-accent-red/90"
        >
          <Trash2 className="h-3 w-3" />
          Delete Ticket
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-bg-secondary border-border">
          <DialogHeader>
            <DialogTitle className="text-text-primary flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent-red" />
              Delete Ticket?
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              Are you sure you want to delete this ticket? This action cannot be undone.
              <br />
              <span className="text-text-muted mt-2 block">
                Ticket ID: <code className="bg-bg-tertiary px-1 py-0.5 rounded">{ticketId}</code>
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleteTicket.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTicket.isPending}
              className="bg-accent-red hover:bg-accent-red/90"
            >
              {deleteTicket.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ArchiveConfirmDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        onConfirm={handleArchive}
        isPending={archiveTicket.isPending}
        ticketId={ticketId}
      />
    </div>
  )
}
