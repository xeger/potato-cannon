import { createFileRoute } from '@tanstack/react-router'
import { SessionsView } from '@/components/sessions'

export const Route = createFileRoute('/sessions')({
  component: SessionsView
})
