import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { api } from '@/api/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function CreateEpicModal() {
  const isOpen = useAppStore((s) => s.createEpicModalOpen)
  const projectId = useAppStore((s) => s.createEpicModalProjectId)
  const closeModal = useAppStore((s) => s.closeCreateEpicModal)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const resetForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setError(null)
    setIsSubmitting(false)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    closeModal()
  }, [resetForm, closeModal])

  const handleSubmit = useCallback(async () => {
    if (!projectId || !title.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      await api.createEpic(projectId, title.trim(), description.trim() || undefined)
      queryClient.invalidateQueries({ queryKey: ['epics', projectId] })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create epic')
    } finally {
      setIsSubmitting(false)
    }
  }, [projectId, title, description, queryClient, handleClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && title.trim()) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit, title]
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-bg-secondary border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Epic</DialogTitle>
          <DialogDescription>
            Create a new epic to group related tickets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Input
              id="epic-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Epic title"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div>
            <Textarea
              id="epic-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Epic description — shared context for agents (optional)"
              disabled={isSubmitting}
              className="min-h-[120px] resize-y"
            />
          </div>

          {error && <p className="text-sm text-accent-red">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Epic'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
