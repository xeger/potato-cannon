import { Link, useLocation } from '@tanstack/react-router'
import { LayoutDashboard, Lightbulb, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'

export function MobileBottomBar() {
  const location = useLocation()
  const closeTicketSheet = useAppStore((s) => s.closeTicketSheet)

  // Extract projectId from URL
  const projectMatch = location.pathname.match(/^\/projects\/([^/]+)/)
  const projectId = projectMatch ? decodeURIComponent(projectMatch[1]) : null

  if (!projectId) return null // Don't show bar if not on a project route

  const isBoardActive = location.pathname.endsWith('/board')
  const isBrainstormActive = location.pathname.endsWith('/brainstorm')
  const isConfigureActive = location.pathname.endsWith('/configure')

  return (
    <nav className="sm:hidden absolute bottom-0 left-0 w-screen flex items-center px-2 py-2 border-t border-border bg-bg-secondary">
      <Link
        to="/projects/$projectId/brainstorm"
        params={{ projectId }}
        onClick={closeTicketSheet}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isBrainstormActive
            ? 'bg-bg-tertiary text-text-primary'
            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary active:bg-bg-tertiary'
        )}
      >
        <Lightbulb className="h-5 w-5" />
        <span>Brainstorm</span>
      </Link>
      <Link
        to="/projects/$projectId/board"
        params={{ projectId }}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isBoardActive
            ? 'bg-bg-tertiary text-text-primary'
            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary active:bg-bg-tertiary'
        )}
      >
        <LayoutDashboard className="h-5 w-5" />
        <span>Board</span>
      </Link>
      <Link
        to="/projects/$projectId/configure"
        params={{ projectId }}
        onClick={closeTicketSheet}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isConfigureActive
            ? 'bg-bg-tertiary text-text-primary'
            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary active:bg-bg-tertiary'
        )}
      >
        <SlidersHorizontal className="h-5 w-5" />
        <span>Configure</span>
      </Link>
    </nav>
  )
}
