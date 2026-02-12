import { Link, useLocation } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useProjects } from "@/hooks/queries";
import { useAppStore } from "@/stores/appStore";
import { IconButton } from "@/components/ui/icon-button";
import { ProjectMenuItem } from "@/components/layout/ProjectMenuItem";
import { usePendingQuestions } from "@/hooks/usePendingQuestions";
import {
  Sidebar,
  SidebarContent,
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

export function AppSidebar() {
  const { data: projects, isLoading } = useProjects();
  const location = useLocation();
  const openAddProjectModal = useAppStore((s) => s.openAddProjectModal);
  const processingTickets = useAppStore((s) => s.processingTickets);
  const { hasPendingQuestions } = usePendingQuestions();

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

  return (
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
          {/* Add Project - shows below logo when collapsed */}
          <SidebarMenuItem className="group-data-[collapsible=icon]:block hidden">
            <SidebarMenuButton
              tooltip="Add Project"
              onClick={openAddProjectModal}
            >
              <Plus className="h-4 w-4" />
              <span>Add Project</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="justify-between">
            <span>Projects</span>
            <IconButton tooltip="Add Project" onClick={openAddProjectModal}>
              <Plus className="h-4 w-4" />
            </IconButton>
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
                projects?.map((project) => (
                  <ProjectMenuItem
                    key={project.id}
                    project={project}
                    isActive={project.slug === currentProjectSlug}
                    hasActiveSessions={hasActiveSessions(project.id)}
                    hasPendingQuestions={hasPendingQuestions(project.id)}
                  />
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Application Settings">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Application Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter> */}
    </Sidebar>
  );
}
