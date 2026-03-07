import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import os from "os";
import Database from "better-sqlite3";

import { runMigrations } from "../migrations.js";
import { createProjectStore } from "../project.store.js";
import { createTicketStore, TicketStore } from "../ticket.store.js";

describe("TicketStore - epicId mapping", () => {
  let db: Database.Database;
  let ticketStore: TicketStore;
  let testDbPath: string;
  let projectId: string;

  before(() => {
    testDbPath = path.join(os.tmpdir(), `potato-ticket-epic-test-${Date.now()}.db`);
    db = new Database(testDbPath);
    db.pragma("journal_mode = WAL");
    runMigrations(db);

    const projectStore = createProjectStore(db);
    const project = projectStore.createProject({
      displayName: "Test Project",
      path: "/test/epic-ticket",
    });
    projectId = project.id;
    ticketStore = createTicketStore(db);
  });

  after(() => {
    db.close();
    try {
      fs.unlinkSync(testDbPath);
      fs.unlinkSync(testDbPath + "-wal");
      fs.unlinkSync(testDbPath + "-shm");
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    db.prepare("DELETE FROM epic_dependencies").run();
    db.prepare("DELETE FROM epics").run();
    db.prepare("DELETE FROM ticket_history").run();
    db.prepare("DELETE FROM tickets").run();
    db.prepare("DELETE FROM conversations").run();
    db.prepare("DELETE FROM ticket_counters").run();
  });

  it("should return undefined epicId when ticket has no epic", () => {
    const ticket = ticketStore.createTicket(projectId, { title: "No Epic Ticket" });
    assert.strictEqual(ticket.epicId, undefined);
  });

  it("should return epicId when ticket is linked to an epic", () => {
    const now = new Date().toISOString();
    db.prepare("INSERT INTO epics (id, title, summary, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run("epic-1", "Test Epic", "Summary", now, now);

    const ticket = ticketStore.createTicket(projectId, { title: "Epic Ticket" });
    db.prepare("UPDATE tickets SET epic_id = ? WHERE id = ?").run("epic-1", ticket.id);

    const fetched = ticketStore.getTicket(projectId, ticket.id);
    assert.ok(fetched);
    assert.strictEqual(fetched.epicId, "epic-1");
  });
});
