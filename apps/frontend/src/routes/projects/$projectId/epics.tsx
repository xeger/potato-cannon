import { createFileRoute } from '@tanstack/react-router'
import { useProjects, useEpics } from '@/hooks/queries'
import { useAppStore } from '@/stores/appStore'
import { EpicCard } from '@/components/epic/EpicCard'
import { BrainstormColumn } from '@/components/board/BrainstormColumn'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const Route = createFileRoute('/projects/$projectId/epics')({
  component: EpicsPage,
})

function EpicsPage() {
  const { projectId: projectSlug } = Route.useParams()
  const { data: projects } = useProjects()
  const project = projects?.find((p) => p.slug === projectSlug)

  if (!project) return null

  return (
    <div className="h-full flex">
      {/* Desktop only: fixed brainstorm column */}
      <div className="hidden sm:block shrink-0 h-full overflow-y-auto border-r border-border p-4 pr-2">
        <BrainstormColumn projectId={project.id} />
      </div>
      <div className="flex-1 min-w-0 overflow-y-auto">
        <EpicList projectId={project.id} />
      </div>
    </div>
  )
}

function EpicList({ projectId }: { projectId: string }) {
  const { data: epics, isLoading } = useEpics(projectId)
  const openCreateEpicModal = useAppStore((s) => s.openCreateEpicModal)
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
        <Button
          size="sm"
          onClick={() => openCreateEpicModal(projectId)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Create Epic
        </Button>
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
