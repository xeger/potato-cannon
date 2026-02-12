// src/services/session/worker-state.ts

import {
  getWorkerState as getWorkerStateFromStore,
  setWorkerState as setWorkerStateInStore,
  clearWorkerState as clearWorkerStateInStore,
} from "../../stores/ticket.store.js";
import type {
  OrchestrationState,
  WorkerState,
  AgentState,
  RalphLoopState,
  TaskLoopState,
} from "../../types/orchestration.types.js";
import { listTasks } from "../../stores/task.store.js";

/**
 * Get the current orchestration state for a ticket
 */
export function getWorkerState(
  _projectId: string,
  ticketId: string
): OrchestrationState | null {
  return getWorkerStateFromStore(ticketId);
}

/**
 * Save orchestration state for a ticket
 */
export function saveWorkerState(
  _projectId: string,
  ticketId: string,
  state: OrchestrationState
): void {
  state.updatedAt = new Date().toISOString();
  setWorkerStateInStore(ticketId, state);
}

/**
 * Initialize orchestration state for a phase
 */
export function initWorkerState(
  projectId: string,
  ticketId: string,
  phaseId: string
): OrchestrationState {
  const state: OrchestrationState = {
    phaseId,
    workerIndex: 0,
    activeWorker: null,
    updatedAt: new Date().toISOString(),
  };
  saveWorkerState(projectId, ticketId, state);
  return state;
}

/**
 * Clear orchestration state on phase completion
 * Note: File-based archiving is no longer done since state is in SQLite
 * and can be queried/archived through database mechanisms if needed.
 */
export function clearWorkerState(
  _projectId: string,
  ticketId: string
): void {
  clearWorkerStateInStore(ticketId);
}

/**
 * Create initial state for an agent worker
 */
export function createAgentState(workerId: string, sessionId?: string): AgentState {
  return {
    id: workerId,
    type: "agent",
    sessionId,
  };
}

/**
 * Create initial state for a ralphLoop worker
 */
export function createRalphLoopState(workerId: string, maxAttempts?: number): RalphLoopState {
  return {
    id: workerId,
    type: "ralphLoop",
    iteration: 1,
    maxAttempts,
    workerIndex: 0,
    activeWorker: null,
  };
}

/**
 * Create initial state for a taskLoop worker
 * Snapshots pending tasks from the task store
 */
export function createTaskLoopState(
  ticketId: string,
  workerId: string,
  phase: string
): TaskLoopState {
  // Snapshot all pending tasks for this phase
  const tasks = listTasks(ticketId, { phase });
  const pendingTasks = tasks
    .filter((t) => t.status === "pending")
    .map((t) => t.id);

  return {
    id: workerId,
    type: "taskLoop",
    currentTaskId: null,
    pendingTasks,
    completedTasks: [],
    workerIndex: 0,
    activeWorker: null,
  };
}

/**
 * Check if there's a running agent (with sessionId) anywhere in the worker tree
 */
function hasRunningAgentInState(worker: WorkerState | null): boolean {
  if (!worker) return false;
  switch (worker.type) {
    case "agent":
      return !!(worker as AgentState).sessionId;
    case "ralphLoop":
      return hasRunningAgentInState((worker as RalphLoopState).activeWorker);
    case "taskLoop":
      return hasRunningAgentInState((worker as TaskLoopState).activeWorker);
    default:
      return false;
  }
}

/**
 * Check if worker state needs recovery action
 * - Running agent that crashed
 * - Ralph loop that exhausted max attempts
 */
function needsRecovery(worker: WorkerState | null): boolean {
  if (!worker) return false;

  // Check for running agent (existing logic)
  if (hasRunningAgentInState(worker)) return true;

  // Check for ralph loop at max attempts
  if (worker.type === "ralphLoop") {
    const loop = worker as RalphLoopState;
    if (loop.maxAttempts && loop.iteration >= loop.maxAttempts) return true;
    return needsRecovery(loop.activeWorker);
  }

  if (worker.type === "taskLoop") {
    return needsRecovery((worker as TaskLoopState).activeWorker);
  }

  return false;
}

/**
 * Recover a worker that had a running agent crash
 */
function recoverCrashedWorker(worker: WorkerState): WorkerState {
  switch (worker.type) {
    case "agent":
      // Clear session - will be re-spawned
      return { ...(worker as AgentState), sessionId: undefined };

    case "ralphLoop": {
      const loop = worker as RalphLoopState;

      // If at max attempts, reset for fresh retry
      if (loop.maxAttempts && loop.iteration >= loop.maxAttempts) {
        return {
          ...loop,
          iteration: 1,
          workerIndex: 0,
          activeWorker: null,
        };
      }

      // Otherwise, restart current iteration from beginning (existing behavior)
      return {
        ...loop,
        workerIndex: 0,
        activeWorker: null,
      };
    }

    case "taskLoop": {
      const loop = worker as TaskLoopState;

      // If nested worker needs recovery, recurse into it first
      if (loop.activeWorker && needsRecovery(loop.activeWorker)) {
        return {
          ...loop,
          activeWorker: recoverCrashedWorker(loop.activeWorker),
        };
      }

      // Re-queue current task (crash at task loop level)
      if (loop.currentTaskId) {
        return {
          ...loop,
          pendingTasks: [loop.currentTaskId, ...loop.pendingTasks],
          currentTaskId: null,
          workerIndex: 0,
          activeWorker: null,
        };
      }
      return loop;
    }

    default:
      return worker;
  }
}

/**
 * Prepare state for daemon restart recovery
 *
 * Only resets state if there was a running agent that crashed.
 * If no agent was running (previous work completed cleanly), preserves state as-is
 * so execution can continue from where it left off.
 */
export function prepareForRecovery(state: OrchestrationState): OrchestrationState {
  if (!state.activeWorker) return state;

  // Check if recovery is needed (crashed agent OR exhausted ralph loop)
  if (!needsRecovery(state.activeWorker)) {
    // No recovery needed, continue from current state
    return state;
  }

  // Recovery needed - reset appropriate worker state
  return {
    ...state,
    activeWorker: recoverCrashedWorker(state.activeWorker),
  };
}
