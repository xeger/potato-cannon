import { createFileRoute } from '@tanstack/react-router'
import { TemplateList } from '@/components/templates'

export const Route = createFileRoute('/templates/')({
  component: TemplateList
})
