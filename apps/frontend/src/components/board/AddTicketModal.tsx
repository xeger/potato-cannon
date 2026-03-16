import { useState, useCallback, type KeyboardEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

export function AddTicketModal() {
  const queryClient = useQueryClient()
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const isOpen = useAppStore((s) => s.addTicketModalOpen)
  const closeModal = useAppStore((s) => s.closeAddTicketModal)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketNumber, setTicketNumber] = useState('')
  const [ticketNumberError, setTicketNumberError] = useState<string | null>(null)

  const CUSTOM_ID_PATTERN = /^[a-zA-Z0-9_-]*$/

  const handleTicketNumberChange = useCallback((value: string) => {
    setTicketNumber(value)
    if (value === '') {
      setTicketNumberError(null)
    } else if (!CUSTOM_ID_PATTERN.test(value)) {
      setTicketNumberError('Only letters, numbers, hyphens, and underscores allowed')
    } else if (value.length > 20) {
      setTicketNumberError('Max 20 characters')
    } else {
      setTicketNumberError(null)
    }
  }, [])

  const resetForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setTicketNumber('')
    setTicketNumberError(null)
    setError(null)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    closeModal()
  }, [closeModal, resetForm])

  const handleSubmit = useCallback(async () => {
    if (!currentProjectId || !title.trim() || ticketNumberError) return

    setIsSubmitting(true)
    setError(null)

    try {
      const trimmedTicketNumber = ticketNumber.trim()
      await api.createTicket(
        currentProjectId,
        title.trim(),
        description.trim() || undefined,
        trimmedTicketNumber || undefined,
      )
      queryClient.invalidateQueries({ queryKey: ['tickets', currentProjectId] })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket')
    } finally {
      setIsSubmitting(false)
    }
  }, [currentProjectId, title, description, ticketNumber, ticketNumberError, queryClient, handleClose])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && title.trim() && !isSubmitting) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-bg-secondary border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-text-primary">New Ticket</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Create a new ticket in the current project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label htmlFor="ticket-title" className="text-sm text-text-secondary">
              Title
            </label>
            <Input
              id="ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ticket title"
              disabled={isSubmitting}
              autoFocus
              autoComplete="off"
              className="bg-bg-tertiary border-border"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ticket-number" className="text-sm text-text-secondary">
              Ticket Number <span className="text-text-muted">(optional)</span>
            </label>
            <Input
              id="ticket-number"
              value={ticketNumber}
              onChange={(e) => handleTicketNumberChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. JIRA-123 (optional)"
              disabled={isSubmitting}
              autoComplete="off"
              className="bg-bg-tertiary border-border"
            />
            {ticketNumberError && (
              <p className="text-sm text-accent-red">{ticketNumberError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="ticket-description" className="text-sm text-text-secondary">
              Description <span className="text-text-muted">(optional)</span>
            </label>
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ticket description (supports markdown)"
              disabled={isSubmitting}
              className="bg-bg-tertiary border-border min-h-[120px] resize-y"
            />
          </div>

          {error && (
            <p className="text-sm text-accent-red">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSubmitting || !!ticketNumberError}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Ticket'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
