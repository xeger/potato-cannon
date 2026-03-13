import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ActivityTab } from './ActivityTab'

// Mock DOM APIs
HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock TanStack Query
const mockRefetchQueries = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({
    data: [],
    isLoading: false,
  }),
  useQueryClient: () => ({
    refetchQueries: mockRefetchQueries,
  }),
}))

// Mock SSE hooks - store callbacks so we can trigger them
let sessionOutputCallback: ((data: Record<string, unknown>) => void) | null = null
let ticketMessageCallback: ((data: Record<string, unknown>) => void) | null = null
let sessionEndedCallback: ((data: Record<string, unknown>) => void) | null = null

vi.mock('@/hooks/useSSE', () => ({
  useSessionOutput: vi.fn((cb: (data: Record<string, unknown>) => void) => {
    sessionOutputCallback = cb
  }),
  useTicketMessage: vi.fn((cb: (data: Record<string, unknown>) => void) => {
    ticketMessageCallback = cb
  }),
  useSessionEnded: vi.fn((cb: (data: Record<string, unknown>) => void) => {
    sessionEndedCallback = cb
  }),
}))

// Mock API client
vi.mock('@/api/client', () => ({
  api: {
    getTicketMessages: vi.fn().mockResolvedValue({ messages: [] }),
    respondToQuestion: vi.fn(),
  },
}))

// Mock markdown renderer
vi.mock('@/lib/markdown', () => ({
  renderMarkdown: vi.fn((text: string) => text),
}))

// Mock child components that aren't relevant
vi.mock('./ArtifactViewerFull', () => ({
  ArtifactViewerFull: () => null,
}))

vi.mock('./TaskList', () => ({
  TaskList: () => null,
}))

vi.mock('./RestartPhaseButton', () => ({
  RestartPhaseButton: () => null,
}))

describe('ActivityTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionOutputCallback = null
    ticketMessageCallback = null
    sessionEndedCallback = null
  })

  afterEach(() => {
    cleanup()
  })

  it('shows "No messages yet" when there are no messages and no activity', () => {
    render(
      <ActivityTab
        projectId="test-project"
        ticketId="POT-1"
      />
    )

    const emptyStateElement = screen.getByText('No messages yet')
    expect(emptyStateElement).toBeTruthy()
  })

  it('hides "No messages yet" when activity indicator is showing', () => {
    render(
      <ActivityTab
        projectId="test-project"
        ticketId="POT-1"
      />
    )

    // Simulate a session output event that sets currentActivity
    expect(sessionOutputCallback).not.toBeNull()
    sessionOutputCallback!({
      ticketId: 'POT-1',
      event: {
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'read_file',
              input: { path: 'src/index.ts' },
            },
          ],
        },
      },
    })

    // "No messages yet" should be hidden
    const emptyStateElement = screen.queryByText('No messages yet')
    expect(emptyStateElement).toBeNull()
  })
})
