import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { BrainstormMaster } from './BrainstormMaster'
import { BrainstormDetail } from './BrainstormDetail'

type MobileView = 'list' | 'detail'

interface SelectedBrainstorm {
  id: string
  name: string
  initialMessage?: string
}

interface BrainstormPageProps {
  projectId: string
}

export function BrainstormPage({ projectId }: BrainstormPageProps) {
  const queryClient = useQueryClient()

  const [mobileView, setMobileView] = useState<MobileView>('list')
  const [selected, setSelected] = useState<SelectedBrainstorm | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleSelect = useCallback((id: string, name: string) => {
    setSelected({ id, name })
    setMobileView('detail')
  }, [])

  const handleBack = useCallback(() => {
    setMobileView('list')
  }, [])

  const handleNewSession = useCallback(() => {
    setSelected(null)
    setMobileView('detail')
  }, [])

  const handleDelete = useCallback(() => {
    // Invalidate the brainstorms list
    queryClient.invalidateQueries({ queryKey: ['brainstorms', projectId] })
    // Clear selection and show new session form
    setSelected(null)
    setMobileView('list')
  }, [projectId, queryClient])

  const handleCreateBrainstorm = useCallback(async (message: string) => {
    setIsCreating(true)
    try {
      // Create brainstorm with the initial message included in the prompt
      const response = await api.createBrainstorm(projectId, { initialMessage: message })
      const { id, name } = response.brainstorm

      // Invalidate the brainstorms list so it shows the new one
      queryClient.invalidateQueries({ queryKey: ['brainstorms', projectId] })

      // Select the new brainstorm with initial message
      setSelected({ id, name, initialMessage: message })
      setMobileView('detail')
    } catch (error) {
      console.error('Failed to create brainstorm:', error)
    } finally {
      setIsCreating(false)
    }
  }, [projectId, queryClient])

  return (
    <div className="brainstorm-container h-full">
      <div className="brainstorm-layout">
        <BrainstormMaster
          projectId={projectId}
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
          onNewSession={handleNewSession}
          isHidden={mobileView === 'detail'}
        />
        <BrainstormDetail
          projectId={projectId}
          selectedId={selected?.id ?? null}
          selectedName={selected?.name ?? null}
          initialMessage={selected?.initialMessage}
          onBack={handleBack}
          onDelete={handleDelete}
          onCreateBrainstorm={handleCreateBrainstorm}
          isCreating={isCreating}
          isActive={mobileView === 'detail'}
          showMobileHeader={mobileView === 'detail'}
        />
      </div>
    </div>
  )
}
