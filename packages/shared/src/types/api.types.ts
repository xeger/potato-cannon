import type { Brainstorm, BrainstormQuestion, BrainstormMessage } from './brainstorm.types.js'

export interface ApiError {
  error: string
  message?: string
}

export interface CreateBrainstormResponse {
  brainstorm: Brainstorm
}

export interface BrainstormPendingResponse {
  question?: BrainstormQuestion
}

export interface BrainstormMessagesResponse {
  messages: BrainstormMessage[]
}
