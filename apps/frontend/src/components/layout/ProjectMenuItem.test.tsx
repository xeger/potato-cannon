import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectMenuItem } from './ProjectMenuItem'
import { SidebarProvider } from '@/components/ui/sidebar'

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

// Mock the icon picker
vi.mock('@/components/configure/ProjectIconPicker', () => ({
  getProjectIcon: () => () => null,
}))

// Mock TanStack Router Link component
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))

const renderWithSidebar = (component: React.ReactElement) => {
  return render(
    <SidebarProvider>
      {component}
    </SidebarProvider>
  )
}

describe('ProjectMenuItem', () => {
  const mockProject = {
    id: 'proj-1',
    slug: 'my-project',
    path: '/path/to/project',
    displayName: 'My Project',
  }

  it('should render project name', () => {
    renderWithSidebar(
      <ProjectMenuItem
        project={mockProject}
        isActive={false}
        hasActiveSessions={false}
        hasPendingQuestions={false}
      />
    )

    expect(screen.getByText('My Project')).toBeTruthy()
  })

  it('should apply thinking-shimmer class when hasActiveSessions is true', () => {
    const { container } = renderWithSidebar(
      <ProjectMenuItem
        project={mockProject}
        isActive={false}
        hasActiveSessions={true}
        hasPendingQuestions={false}
      />
    )

    expect(container.querySelector('.thinking-shimmer')).toBeTruthy()
  })

  it('should show dot indicator when hasPendingQuestions is true', () => {
    const { container } = renderWithSidebar(
      <ProjectMenuItem
        project={mockProject}
        isActive={false}
        hasActiveSessions={false}
        hasPendingQuestions={true}
      />
    )

    // Look for the dot indicator - a small rounded div with specific styling
    const dotIndicator = container.querySelector('.bg-accent.rounded-full')
    expect(dotIndicator).toBeTruthy()
  })

  it('should apply active styling when isActive is true', () => {
    const { container } = renderWithSidebar(
      <ProjectMenuItem
        project={mockProject}
        isActive={true}
        hasActiveSessions={false}
        hasPendingQuestions={false}
      />
    )

    // The SidebarMenuButton component applies data-active="true" when isActive={true}
    const button = container.querySelector('[data-active="true"]')
    expect(button).toBeTruthy()
  })

  it('should render both shimmer and dot when both conditions are true', () => {
    const { container } = renderWithSidebar(
      <ProjectMenuItem
        project={mockProject}
        isActive={false}
        hasActiveSessions={true}
        hasPendingQuestions={true}
      />
    )

    expect(container.querySelector('.thinking-shimmer')).toBeTruthy()
    expect(container.querySelector('.bg-accent.rounded-full')).toBeTruthy()
  })

  it('should apply project color to text when color is provided', () => {
    const projectWithColor = {
      ...mockProject,
      color: '#FF0000',
    }

    const { container } = renderWithSidebar(
      <ProjectMenuItem
        project={projectWithColor}
        isActive={false}
        hasActiveSessions={false}
        hasPendingQuestions={false}
      />
    )

    const spans = container.querySelectorAll('span.flex-1')
    const projectSpan = Array.from(spans).find(s => s.textContent === 'My Project')
    expect(projectSpan).toBeTruthy()
    expect((projectSpan as HTMLElement).style.color).toBe('rgb(255, 0, 0)')
  })
})
