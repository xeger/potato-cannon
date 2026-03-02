import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SidebarFolderGroup } from './SidebarFolderGroup'
import { SidebarProvider, SidebarMenu } from '@/components/ui/sidebar'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Track sidebar state for tests
let mockSidebarState = 'expanded'

vi.mock('@/components/ui/sidebar', async () => {
  const actual = await vi.importActual('@/components/ui/sidebar')
  return {
    ...actual,
    useSidebar: () => ({
      state: mockSidebarState,
      open: mockSidebarState === 'expanded',
      setOpen: vi.fn(),
      openMobile: false,
      setOpenMobile: vi.fn(),
      isMobile: false,
      toggleSidebar: vi.fn(),
    }),
  }
})

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    Link: ({ children, to, params, ...props }: any) => (
      <a href={to?.replace('$projectId', params?.projectId || '')} data-testid={`link-${params?.projectId}`} {...props}>
        {children}
      </a>
    ),
  }
})

vi.mock('@/components/configure/ProjectIconPicker', () => ({
  getProjectIcon: (name: string) => {
    const MockIcon = ({ className, style }: any) => (
      <span data-testid={`icon-${name}`} className={className} style={style}>icon</span>
    )
    MockIcon.displayName = `MockIcon(${name})`
    return MockIcon
  },
}))

vi.mock('@/api/client', () => ({
  api: {
    renameFolder: vi.fn(),
    deleteFolder: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('@/stores/appStore', () => ({
  useAppStore: (selector: any) => {
    const state = {
      toggleFolderCollapsed: vi.fn(),
      collapsedFolders: [],
    }
    return selector(state)
  },
}))

const mockFolder = {
  id: 'folder-1',
  name: 'Backend Services',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockProjects = [
  {
    id: 'proj-1',
    slug: 'api-gateway',
    path: '/path/to/api-gateway',
    displayName: 'API Gateway',
    folderId: 'folder-1',
    icon: 'server',
    color: '#3b82f6',
  },
  {
    id: 'proj-2',
    slug: 'auth-service',
    path: '/path/to/auth-service',
    displayName: 'Auth Service',
    folderId: 'folder-1',
    icon: 'shield',
    color: undefined,
  },
]

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderFolderGroup(props: Partial<React.ComponentProps<typeof SidebarFolderGroup>> = {}) {
  return render(
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <SidebarMenu>
          <SidebarFolderGroup
            folder={mockFolder}
            projectCount={2}
            isCollapsed={false}
            projects={mockProjects}
            containsActiveProject={false}
            {...props}
          >
            <div data-testid="children-content">Child content</div>
          </SidebarFolderGroup>
        </SidebarMenu>
      </SidebarProvider>
    </QueryClientProvider>
  )
}

describe('SidebarFolderGroup', () => {
  beforeEach(() => {
    mockSidebarState = 'expanded'
    vi.clearAllMocks()
  })

  describe('Expanded sidebar mode', () => {
    it('should render folder name and children in expanded mode', () => {
      renderFolderGroup()

      expect(screen.getByText('Backend Services')).toBeTruthy()
      expect(screen.getByTestId('children-content')).toBeTruthy()
    })
  })

  describe('Collapsed sidebar mode', () => {
    beforeEach(() => {
      mockSidebarState = 'collapsed'
    })

    it('should render a folder monogram icon when sidebar is collapsed', () => {
      renderFolderGroup()

      // Should show the first letter of the folder name as a monogram
      expect(screen.getByText('B')).toBeTruthy()
    })

    it('should uppercase the monogram letter', () => {
      renderFolderGroup({
        folder: { ...mockFolder, name: 'lowercase folder' },
      })

      expect(screen.getByText('L')).toBeTruthy()
    })

    it('should NOT render children content in collapsed mode', () => {
      renderFolderGroup()

      expect(screen.queryByTestId('children-content')).toBeNull()
    })

    it('should show dropdown with child projects on click', async () => {
      const user = userEvent.setup()
      renderFolderGroup()

      // Click the folder button to open dropdown
      const folderButton = screen.getByRole('button')
      await user.click(folderButton)

      // Dropdown should show project names
      expect(screen.getByText('API Gateway')).toBeTruthy()
      expect(screen.getByText('Auth Service')).toBeTruthy()
    })

    it('should apply active highlight when containsActiveProject is true', () => {
      const { container } = renderFolderGroup({
        containsActiveProject: true,
      })

      // The button should have accent styling
      const button = container.querySelector('[data-sidebar="menu-button"]')
      expect(button?.className).toContain('border')
      expect(button?.className).toContain('accent')
    })

    it('should NOT apply active highlight when containsActiveProject is false', () => {
      const { container } = renderFolderGroup({
        containsActiveProject: false,
      })

      const button = container.querySelector('[data-sidebar="menu-button"]')
      // Should not have the accent border class when not active
      const classes = button?.className || ''
      expect(classes.includes('border-accent')).toBe(false)
    })

    it('should render project icons with correct colors in dropdown', async () => {
      const user = userEvent.setup()
      renderFolderGroup()

      const folderButton = screen.getByRole('button')
      await user.click(folderButton)

      // The first project has a color set
      const serverIcon = screen.getByTestId('icon-server')
      expect(serverIcon.style.color).toBe('rgb(59, 130, 246)')
    })
  })
})
