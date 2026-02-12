import { createFileRoute } from '@tanstack/react-router'
import { ConfigurePage } from '@/components/configure/ConfigurePage'
import { useProjects } from '@/hooks/queries'

export const Route = createFileRoute('/projects/$projectId/configure')({
  component: ConfigurePageRoute
})

function ConfigurePageRoute() {
  // URL param is the slug, not the ID
  const { projectId: projectSlug } = Route.useParams()
  const { data: projects } = useProjects()

  // Look up project by slug to get the actual ID for API calls
  const project = projects?.find((p) => p.slug === projectSlug)

  if (!project) {
    return null // Loading or project not found
  }

  return <ConfigurePage projectId={project.id} />
}
