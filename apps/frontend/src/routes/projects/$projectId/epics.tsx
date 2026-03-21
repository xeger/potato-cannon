import { createFileRoute } from '@tanstack/react-router'
import { useProjects, useEpics } from '@/hooks/queries'
import { useAppStore } from '@/stores/appStore'
import { EpicCard } from '@/components/epic/EpicCard'
import { Button } from '@/components/ui/button'
import { Plus, MessageSquarePlus } from 'lucide-react'

export const Route = createFileRoute('/projects/$projectId/epics')({
  component: EpicsPage,
})

function EpicsPage() {
  const { projectId: projectSlug } = Route.useParams()
  const { data: projects } = useProjects()
  const project = projects?.find((p) => p.slug === projectSlug)

  if (!project) return null

  return <EpicList projectId={project.id} />
}

function EpicList({ projectId }: { projectId: string }) {
  const { data: epics, isLoading } = useEpics(projectId)
  const openCreateEpicModal = useAppStore((s) => s.openCreateEpicModal)
  const openNewBrainstormSheet = useAppStore((s) => s.openNewBrainstormSheet)
  const openEpicSheet = useAppStore((s) => s.openEpicSheet)
  const epicSheetEpicId = useAppStore((s) => s.epicSheetEpicId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        Loading epics...
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-text-primary">Epics</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openNewBrainstormSheet(projectId)}
          >
            <MessageSquarePlus className="h-4 w-4 mr-1" />
            Brainstorm
          </Button>
          <Button
            size="sm"
            onClick={() => openCreateEpicModal(projectId)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Epic
          </Button>
        </div>
      </div>

      {!epics || epics.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-sm">No epics yet.</p>
          <p className="text-xs mt-1">Create an epic to group related tickets.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {epics.map((epic) => (
            <EpicCard
              key={epic.id}
              epic={epic}
              isSelected={epicSheetEpicId === epic.id}
              onClick={() => openEpicSheet(projectId, epic.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
