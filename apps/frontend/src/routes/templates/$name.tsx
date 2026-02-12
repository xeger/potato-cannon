import { createFileRoute } from '@tanstack/react-router'
import { TemplateEditor } from '@/components/templates'

export const Route = createFileRoute('/templates/$name')({
  component: TemplateEditorRoute
})

function TemplateEditorRoute() {
  const { name } = Route.useParams()
  return <TemplateEditor name={name} />
}
