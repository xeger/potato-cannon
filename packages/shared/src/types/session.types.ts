export type SessionStatus = 'running' | 'completed' | 'failed'

export interface Session {
  id: string
  projectId: string
  ticketId?: string
  brainstormId?: string
  status: SessionStatus
  startedAt: string
  endedAt?: string
  preview?: string
}

export interface SessionLogEntry {
  type: 'assistant' | 'tool_use' | 'tool_result' | 'system' | 'user'
  content?: string
  tool_name?: string
  tool_input?: Record<string, unknown>
  tool_result?: string
  is_error?: boolean
  timestamp?: string
}
