export const DEFAULT_PHASES = [
  'backlog',
  'refinement',
  'architecture',
  'development',
  'verification',
  'done'
] as const

export const DEFAULT_TRIGGER_PHASES = [
  'refinement',
  'architecture',
  'development',
  'verification'
] as const

export const TERMINAL_PHASES = ['done', 'archived'] as const

export type Phase = typeof DEFAULT_PHASES[number]
export type TriggerPhase = typeof DEFAULT_TRIGGER_PHASES[number]
export type TerminalPhase = typeof TERMINAL_PHASES[number]
