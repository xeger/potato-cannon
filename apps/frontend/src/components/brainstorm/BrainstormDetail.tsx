import { ArrowLeft, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrainstormChat } from './BrainstormChat'
import { BrainstormNewForm } from './BrainstormNewForm'

interface BrainstormDetailProps {
  projectId: string
  selectedId: string | null
  selectedName: string | null
  initialMessage?: string
  onBack: () => void
  onDelete: () => void
  onCreateBrainstorm: (message: string) => Promise<void>
  isCreating: boolean
  isActive: boolean
  showMobileHeader: boolean
}

export function BrainstormDetail({
  projectId,
  selectedId,
  selectedName,
  initialMessage,
  onBack,
  onDelete,
  onCreateBrainstorm,
  isCreating,
  isActive,
  showMobileHeader
}: BrainstormDetailProps) {
  const showNewForm = !selectedId

  return (
    <div
      className="brainstorm-detail"
      data-active={isActive}
    >
      {showNewForm ? (
        <>
          {/* Mobile header for new form */}
          {showMobileHeader && (
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onBack}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Lightbulb className="h-4 w-4 text-accent-yellow" />
              <span className="text-sm font-medium text-text-primary">
                New Brainstorm
              </span>
            </div>
          )}
          <BrainstormNewForm
            onSubmit={onCreateBrainstorm}
            isSubmitting={isCreating}
          />
        </>
      ) : (
        <BrainstormChat
          key={selectedId}
          projectId={projectId}
          brainstormId={selectedId}
          brainstormName={selectedName || 'Brainstorm'}
          initialMessage={initialMessage}
          onBack={onBack}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}
