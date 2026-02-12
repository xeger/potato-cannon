import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePendingQuestions } from './usePendingQuestions'

describe('usePendingQuestions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should return false when no pending questions exist', () => {
    const { result } = renderHook(() => usePendingQuestions())

    expect(result.current.hasPendingQuestions('proj-1')).toBe(false)
  })

  it('should detect pending question from brainstorm message event', () => {
    const { result } = renderHook(() => usePendingQuestions())

    // Simulate SSE event
    act(() => {
      window.dispatchEvent(new CustomEvent('sse:brainstorm-message', {
        detail: {
          projectId: 'proj-1',
          brainstormId: 'brainstorm-1',
          message: {
            type: 'question',
            conversationId: 'conv-1'
          }
        }
      }))
    })

    expect(result.current.hasPendingQuestions('proj-1')).toBe(true)
  })

  it('should clear pending when user responds', () => {
    const { result } = renderHook(() => usePendingQuestions())

    // First, add a pending question
    act(() => {
      window.dispatchEvent(new CustomEvent('sse:brainstorm-message', {
        detail: {
          projectId: 'proj-1',
          brainstormId: 'brainstorm-1',
          message: {
            type: 'question',
            conversationId: 'conv-1'
          }
        }
      }))
    })

    expect(result.current.hasPendingQuestions('proj-1')).toBe(true)

    // User responds
    act(() => {
      window.dispatchEvent(new CustomEvent('sse:brainstorm-message', {
        detail: {
          projectId: 'proj-1',
          brainstormId: 'brainstorm-1',
          message: {
            type: 'user'
          }
        }
      }))
    })

    expect(result.current.hasPendingQuestions('proj-1')).toBe(false)
  })

  it('should detect pending question from ticket message event', () => {
    const { result } = renderHook(() => usePendingQuestions())

    // Simulate SSE event for ticket
    act(() => {
      window.dispatchEvent(new CustomEvent('sse:ticket-message', {
        detail: {
          projectId: 'proj-2',
          ticketId: 'ticket-1',
          message: {
            type: 'question',
            conversationId: 'conv-2'
          }
        }
      }))
    })

    expect(result.current.hasPendingQuestions('proj-2')).toBe(true)
  })

  it('should clear pending when user responds to ticket question', () => {
    const { result } = renderHook(() => usePendingQuestions())

    // First, add a pending question from ticket
    act(() => {
      window.dispatchEvent(new CustomEvent('sse:ticket-message', {
        detail: {
          projectId: 'proj-2',
          ticketId: 'ticket-1',
          message: {
            type: 'question',
            conversationId: 'conv-2'
          }
        }
      }))
    })

    expect(result.current.hasPendingQuestions('proj-2')).toBe(true)

    // User responds
    act(() => {
      window.dispatchEvent(new CustomEvent('sse:ticket-message', {
        detail: {
          projectId: 'proj-2',
          ticketId: 'ticket-1',
          message: {
            type: 'user'
          }
        }
      }))
    })

    expect(result.current.hasPendingQuestions('proj-2')).toBe(false)
  })

  it('should store conversation id in localStorage when markSeen is called', () => {
    const { result } = renderHook(() => usePendingQuestions())

    // Add a pending question
    act(() => {
      window.dispatchEvent(new CustomEvent('sse:brainstorm-message', {
        detail: {
          projectId: 'proj-1',
          brainstormId: 'brainstorm-1',
          message: {
            type: 'question',
            conversationId: 'conv-1'
          }
        }
      }))
    })

    // Mark as seen
    act(() => {
      result.current.markSeen('proj-1', 'brainstorm', 'brainstorm-1')
    })

    // Verify localStorage was updated
    const seenKey = 'pending-seen-proj-1-brainstorm-brainstorm-1'
    expect(localStorage.getItem(seenKey)).toBe('conv-1')
  })

  it('should store conversation id in localStorage for ticket markSeen', () => {
    const { result } = renderHook(() => usePendingQuestions())

    // Add a pending question from ticket
    act(() => {
      window.dispatchEvent(new CustomEvent('sse:ticket-message', {
        detail: {
          projectId: 'proj-2',
          ticketId: 'ticket-1',
          message: {
            type: 'question',
            conversationId: 'conv-2'
          }
        }
      }))
    })

    // Mark as seen
    act(() => {
      result.current.markSeen('proj-2', 'ticket', 'ticket-1')
    })

    // Verify localStorage was updated
    const seenKey = 'pending-seen-proj-2-ticket-ticket-1'
    expect(localStorage.getItem(seenKey)).toBe('conv-2')
  })
})
