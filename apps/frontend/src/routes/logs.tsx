import { createFileRoute } from '@tanstack/react-router'
import { LogsView } from '@/components/logs'

export const Route = createFileRoute('/logs')({
  component: LogsView
})
