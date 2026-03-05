import { countTicketsInPhase } from "../../stores/ticket.store.js";
import { getProjectById } from "../../stores/project.store.js";

const EXCLUDED_PHASES = ["Ideas", "Blocked", "Done"];

export function isPhaseAtWipLimit(projectId: string, phase: string): boolean {
  if (EXCLUDED_PHASES.includes(phase)) return false;

  const project = getProjectById(projectId);
  const limit = project?.wipLimits?.[phase];
  if (!limit) return false;

  const count = countTicketsInPhase(projectId, phase);
  return count >= limit;
}

export function getWipStatus(
  projectId: string,
  phase: string
): { current: number; limit: number | null; atLimit: boolean } {
  const project = getProjectById(projectId);
  const limit = project?.wipLimits?.[phase] ?? null;
  const count = countTicketsInPhase(projectId, phase);
  return {
    current: count,
    limit,
    atLimit: limit !== null && count >= limit,
  };
}
