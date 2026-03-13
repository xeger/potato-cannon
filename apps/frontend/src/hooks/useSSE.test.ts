import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock appStore before importing useSSE
vi.mock('@/stores/appStore', () => ({
  useAppStore: (selector: any) => {
    const state = {
      setProcessingTickets: vi.fn(),
      removeProcessingTicket: vi.fn(),
      setPendingTickets: vi.fn(),
      addPendingTicket: vi.fn(),
      removePendingTicket: vi.fn(),
      setTicketActivity: vi.fn(),
      clearTicketActivity: vi.fn(),
    }
    return selector(state)
  },
}))

vi.mock('@/lib/utils', () => ({
  formatToolActivity: vi.fn(() => 'doing something'),
}))

import { useSSE } from './useSSE'

describe('useSSE - session:ended brainstorm refetch', () => {
  let queryClient: QueryClient
  let mockEventSource: any
  let eventListeners: Record<string, Function>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.spyOn(queryClient, 'refetchQueries')

    eventListeners = {}
    mockEventSource = {
      addEventListener: vi.fn((event: string, handler: Function) => {
        eventListeners[event] = handler
      }),
      close: vi.fn(),
      onopen: null as any,
      onerror: null as any,
    }

    class MockEventSource {
      addEventListener(event: string, handler: Function) {
        eventListeners[event] = handler
      }
      close() {}
      onopen: any = null
      onerror: any = null
    }

    vi.stubGlobal('EventSource', MockEventSource as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('refetches brainstorms query on session:ended', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    renderHook(() => useSSE(), { wrapper })

    // Simulate session:ended event
    const sessionEndedHandler = eventListeners['session:ended']
    expect(sessionEndedHandler).toBeDefined()

    sessionEndedHandler({ data: JSON.stringify({ projectId: 'p1', ticketId: 't1' }) })

    expect(queryClient.refetchQueries).toHaveBeenCalledWith({ queryKey: ['brainstorms'] })
  })
})
