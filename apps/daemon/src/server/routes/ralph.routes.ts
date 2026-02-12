// src/server/routes/ralph.routes.ts

import type { Express, Request, Response } from "express";

// In-memory store for pending verdicts per session
// Key: `${projectId}:${ticketId}`, Value: { approved, feedback }
const pendingVerdicts = new Map<string, { approved: boolean; feedback?: string }>();

export function getVerdictKey(projectId: string, ticketId: string): string {
  return `${projectId}:${ticketId}`;
}

export function getPendingVerdict(
  projectId: string,
  ticketId: string
): { approved: boolean; feedback?: string } | null {
  const key = getVerdictKey(projectId, ticketId);
  const verdict = pendingVerdicts.get(key);
  if (verdict) {
    pendingVerdicts.delete(key);
    return verdict;
  }
  return null;
}

export function registerRalphRoutes(app: Express): void {
  app.post(
    "/api/tickets/:project/:id/ralph-verdict",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        const { approved, feedback } = req.body;

        if (typeof approved !== "boolean") {
          return res.status(400).json({ error: "approved must be a boolean" });
        }

        const key = getVerdictKey(projectId, ticketId);
        pendingVerdicts.set(key, { approved, feedback });

        res.json({ success: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
      }
    }
  );
}
