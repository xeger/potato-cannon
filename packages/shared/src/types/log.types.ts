export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: Record<string, unknown>
}
