import { useState, useCallback, useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { X, Lightbulb } from 'lucide-react'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/appStore'
import { Button } from '@/components/ui/button'
import { BrainstormChat } from './BrainstormChat'
import { BrainstormNewForm } from './BrainstormNewForm'

export function BrainstormDetailPanel() {
  const brainstormSheetOpen = useAppStore((s) => s.brainstormSheetOpen)
  const brainstormSheetBrainstormId = useAppStore((s) => s.brainstormSheetBrainstormId)
  const brainstormSheetProjectId = useAppStore((s) => s.brainstormSheetProjectId)
  const brainstormSheetBrainstormName = useAppStore((s) => s.brainstormSheetBrainstormName)
  const brainstormSheetIsCreating = useAppStore((s) => s.brainstormSheetIsCreating)
  const closeBrainstormSheet = useAppStore((s) => s.closeBrainstormSheet)
  const openBrainstormSheet = useAppStore((s) => s.openBrainstormSheet)
  const currentProjectId = useAppStore((s) => s.currentProjectId)

  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Only show panel on board view and when viewing the same project
  const location = useLocation()
  const isOnBoardView = !!location.pathname.match(/^\/projects\/[^/]+\/board/)
  const isCorrectProject = currentProjectId === brainstormSheetProjectId

  const isOpen = brainstormSheetOpen && isOnBoardView && isCorrectProject

  // Handle escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return

      // Don't close if a Radix dialog is open
      const openDialog = document.querySelector('[data-slot="dialog-content"][data-state="open"]')
      if (openDialog) return

      // If focus is in an input/textarea, blur it instead of closing
      const activeElement = document.activeElement
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement
      ) {
        activeElement.blur()
        return
      }

      closeBrainstormSheet()
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, closeBrainstormSheet])

  const handleCreateBrainstorm = useCallback(async (message: string) => {
    if (!brainstormSheetProjectId) return
    setIsSubmitting(true)
    try {
      const response = await api.createBrainstorm(brainstormSheetProjectId, { initialMessage: message })
      const { id, name } = response.brainstorm

      // Invalidate the brainstorms list so it shows the new one
      queryClient.invalidateQueries({ queryKey: ['brainstorms', brainstormSheetProjectId] })

      // Transition from creation mode to chat mode
      openBrainstormSheet(brainstormSheetProjectId, id, name)
    } catch (error) {
      console.error('Failed to create brainstorm:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [brainstormSheetProjectId, queryClient, openBrainstormSheet])

  const handleDelete = useCallback(() => {
    if (!brainstormSheetProjectId) return
    queryClient.invalidateQueries({ queryKey: ['brainstorms', brainstormSheetProjectId] })
    closeBrainstormSheet()
  }, [brainstormSheetProjectId, queryClient, closeBrainstormSheet])

  const headerTitle = brainstormSheetIsCreating
    ? 'New Brainstorm'
    : brainstormSheetBrainstormName || 'Brainstorm'

  return (
    <div
      className="brainstorm-detail-panel"
      data-open={isOpen}
    >
      <div className="flex flex-col h-full w-[600px] max-w-[40vw]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Lightbulb className="h-4 w-4 text-accent-yellow shrink-0" />
            <h2 className="text-text-primary text-lg font-semibold truncate">
              {headerTitle}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-text-muted hover:text-text-primary shrink-0"
            onClick={closeBrainstormSheet}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 mt-4">
          {brainstormSheetIsCreating ? (
            <BrainstormNewForm
              onSubmit={handleCreateBrainstorm}
              isSubmitting={isSubmitting}
            />
          ) : brainstormSheetBrainstormId && brainstormSheetProjectId ? (
            <BrainstormChat
              projectId={brainstormSheetProjectId}
              brainstormId={brainstormSheetBrainstormId}
              brainstormName={brainstormSheetBrainstormName || 'Brainstorm'}
              onDelete={handleDelete}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
