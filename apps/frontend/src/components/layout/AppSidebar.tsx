import { Link, useLocation } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Plus, FolderPlus } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useProjects, useFolders, useUpdateProject } from "@/hooks/queries";
import { useAppStore } from "@/stores/appStore";
import { IconButton } from "@/components/ui/icon-button";
import { ProjectMenuItem } from "@/components/layout/ProjectMenuItem";
import { SidebarFolderGroup } from "@/components/layout/SidebarFolderGroup";
import { UngroupedDropZone } from "@/components/layout/UngroupedDropZone";
import { usePendingQuestions } from "@/hooks/usePendingQuestions";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type LogoVariant = "standard" | "premium";

function PotatoCannonLogo({
  collapsed = false,
  variant = "standard",
}: {
  collapsed?: boolean;
  variant?: LogoVariant;
}) {
  const variantClass = variant === "standard" ? "brand-logo--standard" : "";
  return (
    <div className="brand-logo__wrapper">
      <div
        className={`brand-logo ${collapsed ? "brand-logo--collapsed" : ""} ${variantClass}`}
      >
        {/* Animated potato projectile */}
        <div className="brand-logo__potato">
          <svg viewBox="0 0 32 32" className="brand-logo__potato-svg">
            {/* Potato body */}
            <ellipse
              cx="16"
              cy="16"
              rx="11"
              ry="9"
              className="brand-logo__potato-body"
            />
            {/* Potato spots */}
            <circle
              cx="12"
              cy="13"
              r="1.5"
              className="brand-logo__potato-spot"
            />
            <circle cx="19" cy="11" r="1" className="brand-logo__potato-spot" />
            <circle
              cx="14"
              cy="19"
              r="1.2"
              className="brand-logo__potato-spot"
            />
            <circle
              cx="21"
              cy="17"
              r="0.8"
              className="brand-logo__potato-spot"
            />
            {/* Motion lines */}
            <line
              x1="3"
              y1="14"
              x2="6"
              y2="14"
              className="brand-logo__motion-line"
            />
            <line
              x1="2"
              y1="17"
              x2="5"
              y2="17"
              className="brand-logo__motion-line"
            />
            <line
              x1="4"
              y1="20"
              x2="7"
              y2="20"
              className="brand-logo__motion-line"
            />
          </svg>
        </div>

        {/* Text treatment */}
        {!collapsed && (
          <div className="brand-logo__text">
            <span className="brand-logo__title">POTATO</span>
            <span className="brand-logo__subtitle">CANNON</span>
          </div>
        )}
      </div>

      {/* Edition label - outside brand-logo to avoid clipping */}
      {!collapsed && variant === "premium" && (
        <span className="brand-logo__edition">Yukon Gold Edition</span>
      )}
    </div>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      width="16"
      height="16"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
    </svg>
  );
}

export function AppSidebar() {
  const { data: projects, isLoading } = useProjects();
  const { data: folders } = useFolders();
  const location = useLocation();
  const openAddProjectModal = useAppStore((s) => s.openAddProjectModal);
  const openCreateFolderModal = useAppStore((s) => s.openCreateFolderModal);
  const processingTickets = useAppStore((s) => s.processingTickets);
  const collapsedFolders = useAppStore((s) => s.collapsedFolders);
  const expandFolder = useAppStore((s) => s.expandFolder);
  const { hasPendingQuestions } = usePendingQuestions();
  const updateProject = useUpdateProject();

  const [draggedProject, setDraggedProject] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px activation constraint
      },
    })
  );

  // Check if a project has any processing tickets
  const hasActiveSessions = (projectId: string) => {
    const tickets = processingTickets.get(projectId);
    return tickets ? tickets.size > 0 : false;
  };

  // Extract project slug from URL
  const projectMatch = location.pathname.match(/^\/projects\/([^/]+)/);
  const currentProjectSlug = projectMatch
    ? decodeURIComponent(projectMatch[1])
    : null;

  // Find the current project
  const currentProject = projects?.find((p) => p.slug === currentProjectSlug);

  // Auto-expand folder if active project is in it
  useEffect(() => {
    if (currentProject && currentProject.folderId && collapsedFolders.includes(currentProject.folderId)) {
      expandFolder(currentProject.folderId);
    }
  }, [currentProject, collapsedFolders, expandFolder]);

  // Group projects by folder
  const groupedProjects: Record<string, typeof projects> = {};
  const ungroupedProjects: typeof projects = [];

  if (projects) {
    projects.forEach((project) => {
      if (project.folderId) {
        const folderId = project.folderId;
        if (!groupedProjects[folderId]) {
          groupedProjects[folderId] = [];
        }
        (groupedProjects[folderId] as typeof projects).push(project);
      } else {
        ungroupedProjects.push(project);
      }
    });
  }

  // Sort folders alphabetically
  const sortedFolders = (folders || []).sort((a, b) => a.name.localeCompare(b.name));

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const projectId = event.active.data?.current?.projectId;
    if (projectId) {
      setDraggedProject(projectId);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDraggedProject(null);

    const { active, over } = event;
    if (!over || !projects) return;

    const projectId = active.id as string;
    const draggedProj = projects.find((p) => p.id === projectId);
    if (!draggedProj) return;

    // Extract target folder ID from the drop zone
    const targetFolderId = over.data?.current?.folderId || null;

    // Don't update if dropping in the same folder
    if (draggedProj.folderId === targetFolderId) return;

    // Call the API to move the project
    updateProject.mutate(
      {
        id: projectId,
        updates: { folderId: targetFolderId },
      },
      {
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to move project';
          toast.error(errorMessage);
        },
      }
    );
  }, [projects, updateProject]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Sidebar collapsible="icon">
        <SidebarHeader className="m-0 p-0 gap-0">
          {/* Expanded branding */}
          <Link
            to="/"
            className="group-data-[collapsible=icon]:hidden flex items-center cursor-pointer"
          >
            <PotatoCannonLogo />
          </Link>
          {/* Collapsed branding - just the potato */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/"
                className="hidden group-data-[collapsible=icon]:flex justify-center items-center cursor-pointer"
              >
                <PotatoCannonLogo collapsed />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Potato Cannon</TooltipContent>
          </Tooltip>
          <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            {/* Dropdown menu - shows below logo when collapsed */}
            <SidebarMenuItem className="group-data-[collapsible=icon]:block hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton tooltip="New">
                    <Plus className="h-4 w-4" />
                    <span>New</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuItem onClick={openAddProjectModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openCreateFolderModal}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="justify-between">
              <span>Projects</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton tooltip="New">
                    <Plus className="h-4 w-4" />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end">
                  <DropdownMenuItem onClick={openAddProjectModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openCreateFolderModal}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isLoading ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                      <span className="text-sidebar-foreground/50">
                        Loading...
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  <>
                    {/* Render folders with their projects */}
                    {sortedFolders.map((folder) => {
                      const folderProjects = groupedProjects[folder.id] || []
                      const containsActive = folderProjects.some(
                        (project) => project.slug === currentProjectSlug
                      )
                      return (
                      <SidebarFolderGroup
                        key={folder.id}
                        folder={folder}
                        projectCount={folderProjects.length}
                        isCollapsed={collapsedFolders.includes(folder.id)}
                        projects={folderProjects}
                        containsActiveProject={containsActive}
                      >
                        <SidebarMenu>
                          {groupedProjects[folder.id]?.map((project) => (
                            <ProjectMenuItem
                              key={project.id}
                              project={project}
                              isActive={project.slug === currentProjectSlug}
                              hasActiveSessions={hasActiveSessions(project.id)}
                              hasPendingQuestions={hasPendingQuestions(project.id)}
                            />
                          ))}
                        </SidebarMenu>
                      </SidebarFolderGroup>
                    )
                    })}

                    {/* Render ungrouped projects */}
                    <UngroupedDropZone>
                      <SidebarMenu>
                        {ungroupedProjects.map((project) => (
                          <ProjectMenuItem
                            key={project.id}
                            project={project}
                            isActive={project.slug === currentProjectSlug}
                            hasActiveSessions={hasActiveSessions(project.id)}
                            hasPendingQuestions={hasPendingQuestions(project.id)}
                          />
                        ))}
                      </SidebarMenu>
                    </UngroupedDropZone>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Join the Discord">
                <a
                  href="https://discord.gg/8mJUgbyp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <DiscordIcon className="size-4" />
                  <span>Join the Discord</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedProject && (
          <div className="flex items-center gap-2 bg-sidebar rounded-md px-3 py-1.5 shadow-lg border">
            <span className="text-sm">{projects?.find((p) => p.id === draggedProject)?.displayName || draggedProject}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
