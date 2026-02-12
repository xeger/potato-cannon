import { Link } from '@tanstack/react-router'
import { getProjectIcon } from '@/components/configure/ProjectIconPicker'
import { cn } from '@/lib/utils'
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import type { Project } from '@potato-cannon/shared'

interface ProjectMenuItemProps {
  project: Project
  isActive: boolean
  hasActiveSessions: boolean
  hasPendingQuestions: boolean
}

export function ProjectMenuItem({
  project,
  isActive,
  hasActiveSessions,
  hasPendingQuestions,
}: ProjectMenuItemProps) {
  const Icon = getProjectIcon(project.icon || 'package')
  const colorStyle = project.color ? { color: project.color } : undefined

  return (
    <SidebarMenuItem className={cn(hasActiveSessions && 'thinking-shimmer')}>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={project.displayName || project.id}
      >
        <Link to="/projects/$projectId/board" params={{ projectId: project.slug }}>
          <Icon className="h-4 w-4" style={colorStyle} />
          <span style={colorStyle} className="flex-1">
            {project.displayName || project.id}
          </span>
          {hasPendingQuestions && (
            <span className="shrink-0 flex items-center justify-center w-2 h-2 bg-accent rounded-full" />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
