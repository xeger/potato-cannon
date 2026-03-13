import Database from "better-sqlite3";
import { DB_FILE } from "../config/paths.js";
import { runMigrations } from "./migrations.js";

let db: Database.Database | null = null;

/**
 * Initialize the SQLite database.
 * Creates the database file if it doesn't exist.
 * Enables WAL mode for better concurrency.
 * Runs any pending migrations.
 */
export function initDatabase(): void {
  if (db) {
    return; // Already initialized
  }

  db = new Database(DB_FILE);

  // Enable WAL mode for better concurrent read/write
  db.pragma("journal_mode = WAL");

  // Run migrations
  runMigrations(db);
}

/**
 * Get the database instance.
 * Throws if database hasn't been initialized.
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

/**
 * Close the database connection.
 * Call during graceful shutdown.
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
