// src/system-agents/types.ts

/**
 * Result returned by all system agents.
 */
export interface SystemAgentResult {
  /** Execution status */
  status: "success" | "failed" | "interrupted";
  /** Primary text output from Claude */
  output: string;
  /** Named artifacts produced (e.g., { 'brainstorm.md': '...' }) */
  artifacts?: Record<string, string>;
  /** Agent-specific metadata */
  metadata?: Record<string, unknown>;
  /** Claude process exit code */
  exitCode?: number;
  /** Session ID for debugging/logs */
  sessionId?: string;
}

/**
 * Loaded system agent definition.
 */
export interface SystemAgentDefinition {
  name: string;
  description: string;
  prompt: string;
}

/**
 * Options for running a system agent.
 */
export interface SystemAgentOptions {
  /** Project ID for MCP context */
  projectId?: string;
  /** Ticket ID for MCP context */
  ticketId?: string;
  /** Brainstorm ID for MCP context */
  brainstormId?: string;
  /** Working directory for Claude process */
  workingDir?: string;
  /** Optional timeout in milliseconds */
  timeout?: number;
}
