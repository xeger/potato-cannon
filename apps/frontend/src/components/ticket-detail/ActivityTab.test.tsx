import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { ActivityTab } from './ActivityTab'

// Mock DOM APIs
HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock TanStack Query
const mockRefetchQueries = vi.fn()
let mockUseQueryReturnValue = {
  data: [] as unknown[],
  isLoading: false,
}

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => mockUseQueryReturnValue),
  useQueryClient: () => ({
    refetchQueries: mockRefetchQueries,
  }),
}))

// Mock appStore
const mockIsTicketProcessing = vi.fn().mockReturnValue(false)
const mockIsTicketPending = vi.fn().mockReturnValue(false)

vi.mock('@/stores/appStore', () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      isTicketProcessing: mockIsTicketProcessing,
      isTicketPending: mockIsTicketPending,
    }
    return selector(state)
  },
}))

// Mock SSE hooks - store callbacks so we can trigger them
let sessionOutputCallback: ((data: Record<string, unknown>) => void) | null = null
let sessionEndedCallback: ((data: { ticketId?: string }) => void) | null = null

vi.mock('@/hooks/useSSE', () => ({
  useSessionOutput: vi.fn((cb: (data: Record<string, unknown>) => void) => {
    sessionOutputCallback = cb
  }),
  useTicketMessage: vi.fn(() => {}),
  useSessionEnded: vi.fn((cb: (data: { ticketId?: string }) => void) => {
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

  it('hides "No messages yet" when activity indicator is showing', async () => {
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

    // "No messages yet" should be hidden after state update
    await waitFor(() => {
      const emptyStateElement = screen.queryByText('No messages yet')
      expect(emptyStateElement).toBeNull()
    })
  })
})

describe('ActivityTab - Disabled Input When No Agent Active', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsTicketProcessing.mockReturnValue(false)
    mockIsTicketPending.mockReturnValue(false)
  })

  afterEach(() => {
    cleanup()
  })

  it('disables textarea when no agent is active', () => {
    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    const textarea = screen.getByPlaceholderText('No agent is running for this phase')
    expect(textarea).toBeTruthy()
    expect((textarea as HTMLTextAreaElement).disabled).toBe(true)
  })

  it('disables send button when no agent is active', () => {
    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    const sendButton = screen.getByRole('button')
    expect(sendButton).toBeTruthy()
    expect((sendButton as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables textarea when agent is processing', () => {
    mockIsTicketProcessing.mockReturnValue(true)

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    const textarea = screen.getByPlaceholderText('Type your response...')
    expect(textarea).toBeTruthy()
    expect((textarea as HTMLTextAreaElement).disabled).toBe(false)
  })

  it('enables textarea when agent is pending', () => {
    mockIsTicketPending.mockReturnValue(true)

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    const textarea = screen.getByPlaceholderText('Type your response...')
    expect(textarea).toBeTruthy()
    expect((textarea as HTMLTextAreaElement).disabled).toBe(false)
  })

  it('enables send button when agent is active and input has text', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    mockIsTicketProcessing.mockReturnValue(true)

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    const textarea = screen.getByPlaceholderText('Type your response...')
    await userEvent.type(textarea, 'Hello')

    const sendButton = screen.getByRole('button')
    expect((sendButton as HTMLButtonElement).disabled).toBe(false)
  })

  it('shows explanatory placeholder when no agent is active', () => {
    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    const textarea = screen.getByPlaceholderText('No agent is running for this phase')
    expect(textarea).toBeTruthy()
  })

  it('shows normal placeholder when agent is active', () => {
    mockIsTicketProcessing.mockReturnValue(true)

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    const textarea = screen.getByPlaceholderText('Type your response...')
    expect(textarea).toBeTruthy()
  })
})

describe('ActivityTab - Option Buttons Hidden When No Agent Active', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsTicketProcessing.mockReturnValue(false)
    mockIsTicketPending.mockReturnValue(false)
    mockUseQueryReturnValue = {
      data: [],
      isLoading: false,
    }
  })

  afterEach(() => {
    cleanup()
  })

  it('hides option buttons when no agent is active even if pendingOptions exist', () => {
    // Set up messages with options via the useQuery mock BEFORE rendering
    mockUseQueryReturnValue = {
      data: [
        {
          type: 'question',
          text: 'Pick one',
          options: ['Option A', 'Option B'],
          timestamp: '2026-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
    }

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    expect(screen.queryByText('Option A')).toBeNull()
    expect(screen.queryByText('Option B')).toBeNull()
  })

  it('shows option buttons when agent is active and pendingOptions exist', () => {
    // Set up messages with options via the useQuery mock BEFORE rendering
    mockUseQueryReturnValue = {
      data: [
        {
          type: 'question',
          text: 'Pick one',
          options: ['Option A', 'Option B'],
          timestamp: '2026-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
    }
    mockIsTicketPending.mockReturnValue(true)

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    expect(screen.getByText('Option A')).toBeTruthy()
    expect(screen.getByText('Option B')).toBeTruthy()
  })
})

describe('ActivityTab - Session Ended Clears Waiting State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsTicketProcessing.mockReturnValue(false)
    mockIsTicketPending.mockReturnValue(false)
    mockUseQueryReturnValue = {
      data: [],
      isLoading: false,
    }
    sessionOutputCallback = null
    sessionEndedCallback = null
  })

  afterEach(() => {
    cleanup()
  })

  it('clears ThinkingIndicator when session ends', async () => {
    mockIsTicketProcessing.mockReturnValue(true)

    const { default: userEvent } = await import('@testing-library/user-event')

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    // Type and send a message to trigger isWaitingForResponse
    const textarea = screen.getByPlaceholderText('Type your response...')
    await userEvent.type(textarea, 'Hello')
    const sendButton = screen.getByRole('button')
    await userEvent.click(sendButton)

    // Wait for the send to complete and ThinkingIndicator to appear
    await waitFor(() => {
      expect(screen.getByText('Thinking')).toBeTruthy()
    })

    // Simulate session ending via the captured callback
    expect(sessionEndedCallback).not.toBeNull()
    sessionEndedCallback!({ ticketId: 'POT-1' })

    // ThinkingIndicator should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Thinking')).toBeNull()
    })
  })
})
