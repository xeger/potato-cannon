import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCreateTemplate } from '@/hooks/queries'
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

interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (name: string) => void
}

/**
 * Dialog for creating a new template
 */
export function CreateTemplateDialog({
  open,
  onOpenChange,
  onSuccess
}: CreateTemplateDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createTemplate = useCreateTemplate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Template name is required')
      return
    }

    // Validate name format (alphanumeric, dashes, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
      setError('Name can only contain letters, numbers, dashes, and underscores')
      return
    }

    try {
      await createTemplate.mutateAsync({
        name: trimmedName,
        description: description.trim(),
        phases: [
          { id: 'ideas', name: 'Ideas' },
          { id: 'done', name: 'Done' }
        ]
      })
      setName('')
      setDescription('')
      onSuccess(trimmedName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName('')
      setDescription('')
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>
              Create a new workflow template to define phases and automation for your projects.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="template-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-template"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="template-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this template is for..."
                rows={3}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTemplate.isPending}>
              {createTemplate.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
