import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { BrainstormDetailPanel } from './BrainstormDetailPanel'

const mockInvalidateQueries = vi.fn()

let mockPathname = '/projects/project-1/board'

const mockState = {
  brainstormSheetOpen: true,
  brainstormSheetBrainstormId: 'brainstorm-1',
  brainstormSheetProjectId: 'project-1',
  brainstormSheetBrainstormName: 'Test Brainstorm',
  brainstormSheetIsCreating: false,
  closeBrainstormSheet: vi.fn(),
  openBrainstormSheet: vi.fn(),
  currentProjectId: 'project-1',
}

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: mockPathname }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}))

vi.mock('@/api/client', () => ({
  api: {
    createBrainstorm: vi.fn(),
  },
}))

vi.mock('@/stores/appStore', () => ({
  useAppStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}))

vi.mock('./BrainstormChat', () => ({
  BrainstormChat: () => <div>Brainstorm Chat</div>,
}))

vi.mock('./BrainstormNewForm', () => ({
  BrainstormNewForm: () => <div>Brainstorm New Form</div>,
}))

describe('BrainstormDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/projects/project-1/board'
  })

  it('uses the outer panel width instead of a second fixed width wrapper', () => {
    const { container } = render(<BrainstormDetailPanel />)

    const panel = container.firstElementChild
    const innerWrapper = panel?.firstElementChild

    expect(panel?.className).toContain('brainstorm-detail-panel')
    expect(innerWrapper?.className).toContain('w-full')
    expect(innerWrapper?.className).toContain('max-w-full')
    expect(innerWrapper?.className).not.toContain('w-[600px]')
    expect(innerWrapper?.className).not.toContain('max-w-[40vw]')
  })
})
