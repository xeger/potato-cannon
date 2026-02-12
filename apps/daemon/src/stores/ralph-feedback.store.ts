import type Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { getDatabase } from "./db.js";

// =============================================================================
// Types
// =============================================================================

export type RalphFeedbackStatus = "running" | "approved" | "rejected" | "max_attempts";

export interface RalphFeedback {
  id: string;
  ticketId: string;
  phaseId: string;
  ralphLoopId: string;
  taskId?: string;
  maxAttempts: number;
  status: RalphFeedbackStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RalphIteration {
  id: string;
  ralphFeedbackId: string;
  iteration: number;
  approved: boolean;
  feedback?: string;
  reviewer: string;
  createdAt: string;
}

export interface CreateFeedbackInput {
  ticketId: string;
  phaseId: string;
  ralphLoopId: string;
  taskId?: string;
  maxAttempts: number;
}

export interface CreateIterationInput {
  iteration: number;
  approved: boolean;
  feedback?: string;
  reviewer: string;
}

// =============================================================================
// Row Types
// =============================================================================

interface FeedbackRow {
  id: string;
  ticket_id: string;
  phase_id: string;
  ralph_loop_id: string;
  task_id: string | null;
  max_attempts: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface IterationRow {
  id: string;
  ralph_feedback_id: string;
  iteration: number;
  approved: number;
  feedback: string | null;
  reviewer: string;
  created_at: string;
}

// =============================================================================
// Row Mappers
// =============================================================================

function rowToFeedback(row: FeedbackRow): RalphFeedback {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    phaseId: row.phase_id,
    ralphLoopId: row.ralph_loop_id,
    taskId: row.task_id || undefined,
    maxAttempts: row.max_attempts,
    status: row.status as RalphFeedbackStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToIteration(row: IterationRow): RalphIteration {
  return {
    id: row.id,
    ralphFeedbackId: row.ralph_feedback_id,
    iteration: row.iteration,
    approved: row.approved === 1,
    feedback: row.feedback || undefined,
    reviewer: row.reviewer,
    createdAt: row.created_at,
  };
}

// =============================================================================
// RalphFeedbackStore Class
// =============================================================================

export class RalphFeedbackStore {
  constructor(private db: Database.Database) {}

  // ---------------------------------------------------------------------------
  // Feedback CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create feedback for a ralph loop, or return existing feedback if already present.
   *
   * If feedback already exists with status "running", returns it (idempotent for recovery).
   * If feedback exists with a terminal status (approved/rejected/max_attempts), resets it
   * to "running" for retry scenarios.
   */
  createFeedback(input: CreateFeedbackInput): RalphFeedback {
    // Check for existing feedback with same key
    const existing = this.getFeedbackForLoop(
      input.ticketId,
      input.phaseId,
      input.ralphLoopId,
      input.taskId
    );

    if (existing) {
      // If already running, return it (idempotent for recovery/retry scenarios)
      if (existing.status === "running") {
        return existing;
      }

      // If in terminal state, reset to running for retry
      // This handles cases where we need to re-run a completed loop
      const now = new Date().toISOString();
      this.db
        .prepare("UPDATE ralph_feedback SET status = 'running', updated_at = ? WHERE id = ?")
        .run(now, existing.id);

      return this.getFeedback(existing.id)!;
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO ralph_feedback (id, ticket_id, phase_id, ralph_loop_id, task_id, max_attempts, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'running', ?, ?)`
      )
      .run(
        id,
        input.ticketId,
        input.phaseId,
        input.ralphLoopId,
        input.taskId || null,
        input.maxAttempts,
        now,
        now
      );

    return this.getFeedback(id)!;
  }

  getFeedback(id: string): RalphFeedback | null {
    const row = this.db
      .prepare("SELECT * FROM ralph_feedback WHERE id = ?")
      .get(id) as FeedbackRow | undefined;

    return row ? rowToFeedback(row) : null;
  }

  getFeedbackForLoop(
    ticketId: string,
    phaseId: string,
    ralphLoopId: string,
    taskId?: string
  ): RalphFeedback | null {
    const row = this.db
      .prepare(
        `SELECT * FROM ralph_feedback
         WHERE ticket_id = ? AND phase_id = ? AND ralph_loop_id = ? AND task_id IS ?`
      )
      .get(ticketId, phaseId, ralphLoopId, taskId || null) as FeedbackRow | undefined;

    return row ? rowToFeedback(row) : null;
  }

  updateFeedbackStatus(
    id: string,
    status: RalphFeedbackStatus
  ): RalphFeedback | null {
    const feedback = this.getFeedback(id);
    if (!feedback) return null;

    const now = new Date().toISOString();

    this.db
      .prepare("UPDATE ralph_feedback SET status = ?, updated_at = ? WHERE id = ?")
      .run(status, now, id);

    return this.getFeedback(id);
  }

  deleteFeedback(id: string): boolean {
    // Iterations are deleted automatically via CASCADE
    const result = this.db
      .prepare("DELETE FROM ralph_feedback WHERE id = ?")
      .run(id);
    return result.changes > 0;
  }

  // ---------------------------------------------------------------------------
  // Iteration Operations
  // ---------------------------------------------------------------------------

  addIteration(
    feedbackId: string,
    input: CreateIterationInput
  ): RalphIteration | null {
    const feedback = this.getFeedback(feedbackId);
    if (!feedback) return null;

    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO ralph_iterations (id, ralph_feedback_id, iteration, approved, feedback, reviewer, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        feedbackId,
        input.iteration,
        input.approved ? 1 : 0,
        input.feedback || null,
        input.reviewer,
        now
      );

    return this.getIteration(id);
  }

  getIteration(id: string): RalphIteration | null {
    const row = this.db
      .prepare("SELECT * FROM ralph_iterations WHERE id = ?")
      .get(id) as IterationRow | undefined;

    return row ? rowToIteration(row) : null;
  }

  getIterations(feedbackId: string): RalphIteration[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM ralph_iterations WHERE ralph_feedback_id = ? ORDER BY iteration"
      )
      .all(feedbackId) as IterationRow[];

    return rows.map(rowToIteration);
  }

  getLatestIteration(feedbackId: string): RalphIteration | null {
    const row = this.db
      .prepare(
        `SELECT * FROM ralph_iterations
         WHERE ralph_feedback_id = ?
         ORDER BY iteration DESC
         LIMIT 1`
      )
      .get(feedbackId) as IterationRow | undefined;

    return row ? rowToIteration(row) : null;
  }

  /**
   * Delete all ralph feedback records for a ticket in the specified phases.
   * Iterations are deleted automatically via CASCADE.
   */
  deleteFeedbackForPhases(ticketId: string, phases: string[]): number {
    if (phases.length === 0) return 0;

    const placeholders = phases.map(() => '?').join(',');
    const result = this.db
      .prepare(
        `DELETE FROM ralph_feedback WHERE ticket_id = ? AND phase_id IN (${placeholders})`
      )
      .run(ticketId, ...phases);
    return result.changes;
  }
}

// =============================================================================
// Factory & Convenience Functions
// =============================================================================

export function createRalphFeedbackStore(
  db: Database.Database
): RalphFeedbackStore {
  return new RalphFeedbackStore(db);
}

// Singleton convenience functions
export function createRalphFeedback(
  input: CreateFeedbackInput
): RalphFeedback {
  return new RalphFeedbackStore(getDatabase()).createFeedback(input);
}

export function getRalphFeedback(id: string): RalphFeedback | null {
  return new RalphFeedbackStore(getDatabase()).getFeedback(id);
}

export function getRalphFeedbackForLoop(
  ticketId: string,
  phaseId: string,
  ralphLoopId: string,
  taskId?: string
): RalphFeedback | null {
  return new RalphFeedbackStore(getDatabase()).getFeedbackForLoop(
    ticketId,
    phaseId,
    ralphLoopId,
    taskId
  );
}

export function updateRalphFeedbackStatus(
  id: string,
  status: RalphFeedbackStatus
): RalphFeedback | null {
  return new RalphFeedbackStore(getDatabase()).updateFeedbackStatus(id, status);
}

export function deleteRalphFeedback(id: string): boolean {
  return new RalphFeedbackStore(getDatabase()).deleteFeedback(id);
}

export function addRalphIteration(
  feedbackId: string,
  input: CreateIterationInput
): RalphIteration | null {
  return new RalphFeedbackStore(getDatabase()).addIteration(feedbackId, input);
}

export function getRalphIterations(feedbackId: string): RalphIteration[] {
  return new RalphFeedbackStore(getDatabase()).getIterations(feedbackId);
}

export function getLatestRalphIteration(
  feedbackId: string
): RalphIteration | null {
  return new RalphFeedbackStore(getDatabase()).getLatestIteration(feedbackId);
}

export function deleteRalphFeedbackForPhases(
  ticketId: string,
  phases: string[]
): number {
  return new RalphFeedbackStore(getDatabase()).deleteFeedbackForPhases(ticketId, phases);
}
