import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddTicketModal } from './AddTicketModal'

// Mock external dependencies
const mockCreateTicket = vi.fn()
const mockInvalidateQueries = vi.fn()
const mockCloseModal = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}))

vi.mock('@/stores/appStore', () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      currentProjectId: 'test-project',
      addTicketModalOpen: true,
      closeAddTicketModal: mockCloseModal,
    }),
}))

vi.mock('@/api/client', () => ({
  api: {
    createTicket: (...args: unknown[]) => mockCreateTicket(...args),
  },
}))

// Mock window.matchMedia (needed for Radix UI Dialog)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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

describe('AddTicketModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateTicket.mockResolvedValue({ id: 'TEST-1', title: 'Test' })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the title input with autoComplete="off"', () => {
    render(<AddTicketModal />)
    const titleInput = screen.getByPlaceholderText('Ticket title') as HTMLInputElement
    expect(titleInput.getAttribute('autocomplete')).toBe('off')
  })

  it('renders the ticket number field', () => {
    render(<AddTicketModal />)
    const ticketNumberInput = screen.getByPlaceholderText('e.g. JIRA-123 (optional)')
    expect(ticketNumberInput).toBeTruthy()
  })

  it('submits with custom ticket number', async () => {
    const user = userEvent.setup()
    render(<AddTicketModal />)

    const titleInput = screen.getByPlaceholderText('Ticket title')
    const ticketNumberInput = screen.getByPlaceholderText('e.g. JIRA-123 (optional)')
    const submitButton = screen.getByText('Create Ticket')

    await user.type(titleInput, 'My Ticket')
    await user.type(ticketNumberInput, 'JIRA-456')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCreateTicket).toHaveBeenCalledWith('test-project', 'My Ticket', undefined, 'JIRA-456')
    })
  })

  it('submits without ticket number when field is empty', async () => {
    const user = userEvent.setup()
    render(<AddTicketModal />)

    const titleInput = screen.getByPlaceholderText('Ticket title')
    const submitButton = screen.getByText('Create Ticket')

    await user.type(titleInput, 'Normal Ticket')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCreateTicket).toHaveBeenCalledWith('test-project', 'Normal Ticket', undefined, undefined)
    })
  })

  it('shows validation error for invalid characters in ticket number', async () => {
    const user = userEvent.setup()
    render(<AddTicketModal />)

    const ticketNumberInput = screen.getByPlaceholderText('e.g. JIRA-123 (optional)')
    await user.type(ticketNumberInput, 'JIRA 123')

    expect(screen.getByText(/only letters, numbers, hyphens, and underscores/i)).toBeTruthy()
  })

  it('shows validation error when ticket number exceeds 20 characters', async () => {
    const user = userEvent.setup()
    render(<AddTicketModal />)

    const ticketNumberInput = screen.getByPlaceholderText('e.g. JIRA-123 (optional)')
    await user.type(ticketNumberInput, 'ABCDEFGHIJKLMNOPQRSTU')

    expect(screen.getByText(/max 20 characters/i)).toBeTruthy()
  })
})
