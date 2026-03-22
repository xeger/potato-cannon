import type Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { getDatabase } from "./db.js";
import { getProjectPrefixFromDb } from "./utils.js";
import { createConversationStore } from "./conversation.store.js";
import type {
  Epic,
  EpicStatus,
  EpicWithCounts,
  EpicWithTickets,
  EpicChildTicket,
} from "@potato-cannon/shared";

// =============================================================================
// Types
// =============================================================================

interface EpicRow {
  id: string;
  project_id: string;
  epic_number: number;
  title: string;
  description: string | null;
  conversation_id: string | null;
  created_at: string;
  updated_at: string;
}

interface EpicWithCountsRow extends EpicRow {
  ticket_count: number;
  done_count: number;
  status: EpicStatus;
}

interface ChildTicketRow {
  id: string;
  title: string;
  phase: string;
}

interface PhaseCountRow {
  phase: string;
  count: number;
}

// =============================================================================
// EpicStore Class
// =============================================================================

export class EpicStore {
  constructor(private db: Database.Database) {}

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  create(projectId: string, title: string, description?: string): EpicWithCounts {
    const id = randomUUID();
    const now = new Date().toISOString();
    const epicNumber = this.getNextEpicNumber(projectId);

    this.db
      .prepare(
        `INSERT INTO epics (id, project_id, epic_number, title, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, projectId, epicNumber, title, description || null, now, now);

    return this.getByIdWithCounts(id)!;
  }

  getById(epicId: string): EpicWithCounts | null {
    return this.getByIdWithCounts(epicId);
  }

  getByIdWithTickets(epicId: string): EpicWithTickets | null {
    const epic = this.getByIdWithCounts(epicId);
    if (!epic) return null;

    const tickets = this.db
      .prepare(
        `SELECT id, title, phase FROM tickets
         WHERE epic_id = ? AND (archived IS NULL OR archived = 0)
         ORDER BY created_at ASC`
      )
      .all(epicId) as ChildTicketRow[];

    const phaseBreakdown = this.getPhaseBreakdown(epicId);

    return {
      ...epic,
      phaseBreakdown,
      tickets: tickets.map((t) => ({
        id: t.id,
        title: t.title,
        phase: t.phase,
      })),
    };
  }

  getByProjectAndNumber(projectId: string, epicNumber: number): EpicWithTickets | null {
    const row = this.db
      .prepare("SELECT id FROM epics WHERE project_id = ? AND epic_number = ?")
      .get(projectId, epicNumber) as { id: string } | undefined;

    if (!row) return null;
    return this.getByIdWithTickets(row.id);
  }

  listByProject(projectId: string): EpicWithCounts[] {
    const rows = this.db
      .prepare(
        `SELECT
          e.*,
          COUNT(t.id) as ticket_count,
          SUM(CASE WHEN t.phase = 'Done' THEN 1 ELSE 0 END) as done_count,
          CASE
            WHEN COUNT(t.id) = 0 THEN 'not_started'
            WHEN COUNT(t.id) = SUM(CASE WHEN t.phase = 'Done' THEN 1 ELSE 0 END) THEN 'complete'
            WHEN SUM(CASE WHEN t.phase != 'Ideas' THEN 1 ELSE 0 END) > 0 THEN 'in_progress'
            ELSE 'not_started'
          END as status
        FROM epics e
        LEFT JOIN tickets t ON t.epic_id = e.id AND (t.archived IS NULL OR t.archived = 0)
        WHERE e.project_id = ?
        GROUP BY e.id
        ORDER BY e.epic_number ASC`
      )
      .all(projectId) as EpicWithCountsRow[];

    return rows.map((row) => this.rowToEpicWithCounts(row, projectId));
  }

  update(epicId: string, updates: { title?: string; description?: string }): EpicWithCounts | null {
    const existing = this.db
      .prepare("SELECT id FROM epics WHERE id = ?")
      .get(epicId) as { id: string } | undefined;
    if (!existing) return null;

    const now = new Date().toISOString();
    const fields: string[] = ["updated_at = ?"];
    const values: unknown[] = [now];

    if (updates.title !== undefined) {
      fields.push("title = ?");
      values.push(updates.title);
    }

    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description);
    }

    values.push(epicId);
    this.db
      .prepare(`UPDATE epics SET ${fields.join(", ")} WHERE id = ?`)
      .run(...values);

    return this.getByIdWithCounts(epicId);
  }

  delete(epicId: string): boolean {
    // ON DELETE SET NULL handles unlinking tickets automatically
    const result = this.db
      .prepare("DELETE FROM epics WHERE id = ?")
      .run(epicId);
    return result.changes > 0;
  }

  // ---------------------------------------------------------------------------
  // Ticket-Epic Association
  // ---------------------------------------------------------------------------

  assignTicket(ticketId: string, epicId: string): void {
    const now = new Date().toISOString();
    this.db
      .prepare("UPDATE tickets SET epic_id = ?, updated_at = ? WHERE id = ?")
      .run(epicId, now, ticketId);
  }

  unassignTicket(ticketId: string): void {
    const now = new Date().toISOString();
    this.db
      .prepare("UPDATE tickets SET epic_id = NULL, updated_at = ? WHERE id = ?")
      .run(now, ticketId);
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  ensureConversation(epicId: string, projectId: string): string {
    const row = this.db
      .prepare("SELECT conversation_id FROM epics WHERE id = ?")
      .get(epicId) as { conversation_id: string | null } | undefined;

    if (row?.conversation_id) {
      return row.conversation_id;
    }

    const convStore = createConversationStore(this.db);
    const conversation = convStore.createConversation(projectId);
    const now = new Date().toISOString();

    this.db
      .prepare("UPDATE epics SET conversation_id = ?, updated_at = ? WHERE id = ?")
      .run(conversation.id, now, epicId);

    return conversation.id;
  }

  private getNextEpicNumber(projectId: string): number {
    const row = this.db
      .prepare("SELECT next_number FROM epic_counters WHERE project_id = ?")
      .get(projectId) as { next_number: number } | undefined;

    const nextNumber = row?.next_number ?? 1;

    this.db
      .prepare(
        `INSERT INTO epic_counters (project_id, next_number)
         VALUES (?, ?)
         ON CONFLICT(project_id) DO UPDATE SET next_number = ?`
      )
      .run(projectId, nextNumber + 1, nextNumber + 1);

    return nextNumber;
  }

  private getByIdWithCounts(epicId: string): EpicWithCounts | null {
    const row = this.db
      .prepare(
        `SELECT
          e.*,
          COUNT(t.id) as ticket_count,
          SUM(CASE WHEN t.phase = 'Done' THEN 1 ELSE 0 END) as done_count,
          CASE
            WHEN COUNT(t.id) = 0 THEN 'not_started'
            WHEN COUNT(t.id) = SUM(CASE WHEN t.phase = 'Done' THEN 1 ELSE 0 END) THEN 'complete'
            WHEN SUM(CASE WHEN t.phase != 'Ideas' THEN 1 ELSE 0 END) > 0 THEN 'in_progress'
            ELSE 'not_started'
          END as status
        FROM epics e
        LEFT JOIN tickets t ON t.epic_id = e.id AND (t.archived IS NULL OR t.archived = 0)
        WHERE e.id = ?
        GROUP BY e.id`
      )
      .get(epicId) as EpicWithCountsRow | undefined;

    if (!row) return null;

    const projectId = row.project_id;
    return this.rowToEpicWithCounts(row, projectId);
  }

  private getPhaseBreakdown(epicId: string): Record<string, number> {
    const rows = this.db
      .prepare(
        `SELECT phase, COUNT(*) as count FROM tickets
         WHERE epic_id = ? AND (archived IS NULL OR archived = 0)
         GROUP BY phase`
      )
      .all(epicId) as PhaseCountRow[];

    const breakdown: Record<string, number> = {};
    for (const row of rows) {
      breakdown[row.phase] = row.count;
    }
    return breakdown;
  }

  private generateIdentifier(projectId: string, epicNumber: number): string {
    const prefix = getProjectPrefixFromDb(this.db, projectId);
    return `EP-${prefix}-${epicNumber}`;
  }

  private rowToEpicWithCounts(row: EpicWithCountsRow, projectId: string): EpicWithCounts {
    return {
      id: row.id,
      projectId: row.project_id,
      epicNumber: row.epic_number,
      identifier: this.generateIdentifier(projectId, row.epic_number),
      title: row.title,
      description: row.description,
      status: row.status,
      conversationId: row.conversation_id || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ticketCount: row.ticket_count,
      doneCount: row.done_count,
      phaseBreakdown: this.getPhaseBreakdown(row.id),
    };
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createEpicStore(db: Database.Database): EpicStore {
  return new EpicStore(db);
}

// =============================================================================
// Convenience Functions (Singleton)
// =============================================================================

export function listEpics(projectId: string): EpicWithCounts[] {
  const store = new EpicStore(getDatabase());
  return store.listByProject(projectId);
}

export function getEpicById(epicId: string): EpicWithCounts | null {
  const store = new EpicStore(getDatabase());
  return store.getById(epicId);
}

export function getEpicByIdWithTickets(epicId: string): EpicWithTickets | null {
  const store = new EpicStore(getDatabase());
  return store.getByIdWithTickets(epicId);
}

export function getEpicByProjectAndNumber(
  projectId: string,
  epicNumber: number
): EpicWithTickets | null {
  const store = new EpicStore(getDatabase());
  return store.getByProjectAndNumber(projectId, epicNumber);
}

export function createEpic(
  projectId: string,
  title: string,
  description?: string
): EpicWithCounts {
  const store = new EpicStore(getDatabase());
  return store.create(projectId, title, description);
}

export function updateEpic(
  epicId: string,
  updates: { title?: string; description?: string }
): EpicWithCounts | null {
  const store = new EpicStore(getDatabase());
  return store.update(epicId, updates);
}

export function deleteEpic(epicId: string): boolean {
  const store = new EpicStore(getDatabase());
  return store.delete(epicId);
}

export function assignTicketToEpic(ticketId: string, epicId: string): void {
  const store = new EpicStore(getDatabase());
  store.assignTicket(ticketId, epicId);
}

export function unassignTicketFromEpic(ticketId: string): void {
  const store = new EpicStore(getDatabase());
  store.unassignTicket(ticketId);
}

export function ensureEpicConversation(epicId: string, projectId: string): string {
  const store = new EpicStore(getDatabase());
  return store.ensureConversation(epicId, projectId);
}
