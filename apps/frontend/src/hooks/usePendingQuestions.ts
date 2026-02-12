import { useState, useEffect, useCallback } from 'react'

interface SSEMessageData {
  projectId?: string
  brainstormId?: string
  ticketId?: string
  message?: {
    type?: string
    conversationId?: string
  }
}

interface PendingState {
  hasPendingQuestions: (projectId: string) => boolean
  markSeen: (projectId: string, entityType: 'ticket' | 'brainstorm', entityId: string) => void
}

/**
 * Hook to aggregate pending questions per project.
 * Subscribes to brainstorm:message and ticket:message SSE events.
 * Returns a function to check if a project has any unseen pending questions.
 */
export function usePendingQuestions(): PendingState {
  // Map<projectId, Map<entityKey, conversationId>>
  // entityKey = 'ticket:id' or 'brainstorm:id'
  const [pendingByProject, setPendingByProject] = useState<Map<string, Map<string, string>>>(
    () => new Map()
  )

  // Handle brainstorm messages
  useEffect(() => {
    const handler = (e: CustomEvent<SSEMessageData>) => {
      const { projectId, brainstormId, message } = e.detail
      if (!projectId || !brainstormId || !message) return

      const entityKey = `brainstorm:${brainstormId}`

      if (message.type === 'question' && message.conversationId) {
        // Add pending question
        setPendingByProject((prev) => {
          const newMap = new Map(prev)
          const projectMap = new Map(newMap.get(projectId) || [])
          projectMap.set(entityKey, message.conversationId!)
          newMap.set(projectId, projectMap)
          return newMap
        })
      } else if (message.type === 'user') {
        // User responded, clear pending for this entity
        setPendingByProject((prev) => {
          const newMap = new Map(prev)
          const projectMap = newMap.get(projectId)
          if (projectMap) {
            projectMap.delete(entityKey)
            if (projectMap.size === 0) {
              newMap.delete(projectId)
            } else {
              newMap.set(projectId, new Map(projectMap))
            }
          }
          return newMap
        })
      }
    }

    window.addEventListener('sse:brainstorm-message', handler as EventListener)
    return () => window.removeEventListener('sse:brainstorm-message', handler as EventListener)
  }, [])

  // Handle ticket messages
  useEffect(() => {
    const handler = (e: CustomEvent<SSEMessageData>) => {
      const { projectId, ticketId, message } = e.detail
      if (!projectId || !ticketId || !message) return

      const entityKey = `ticket:${ticketId}`

      if (message.type === 'question' && message.conversationId) {
        // Add pending question
        setPendingByProject((prev) => {
          const newMap = new Map(prev)
          const projectMap = new Map(newMap.get(projectId) || [])
          projectMap.set(entityKey, message.conversationId!)
          newMap.set(projectId, projectMap)
          return newMap
        })
      } else if (message.type === 'user') {
        // User responded, clear pending for this entity
        setPendingByProject((prev) => {
          const newMap = new Map(prev)
          const projectMap = newMap.get(projectId)
          if (projectMap) {
            projectMap.delete(entityKey)
            if (projectMap.size === 0) {
              newMap.delete(projectId)
            } else {
              newMap.set(projectId, new Map(projectMap))
            }
          }
          return newMap
        })
      }
    }

    window.addEventListener('sse:ticket-message', handler as EventListener)
    return () => window.removeEventListener('sse:ticket-message', handler as EventListener)
  }, [])

  const hasPendingQuestions = useCallback(
    (projectId: string): boolean => {
      const projectMap = pendingByProject.get(projectId)
      return projectMap !== undefined && projectMap.size > 0
    },
    [pendingByProject]
  )

  const markSeen = useCallback(
    (projectId: string, entityType: 'ticket' | 'brainstorm', entityId: string) => {
      const entityKey = `${entityType}:${entityId}`
      const seenKey = `pending-seen-${projectId}-${entityType}-${entityId}`
      const projectMap = pendingByProject.get(projectId)
      const conversationId = projectMap?.get(entityKey)

      if (conversationId) {
        localStorage.setItem(seenKey, conversationId)
      }
    },
    [pendingByProject]
  )

  return { hasPendingQuestions, markSeen }
}
