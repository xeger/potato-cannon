import { execFileSync } from "child_process";
import Database from "better-sqlite3";
import { DB_FILE } from "../config/paths.js";
import { runMigrations } from "./migrations.js";

let db: Database.Database | null = null;

/**
 * Verify that the better-sqlite3 native module is compatible with the current
 * Node.js runtime. When the module was compiled against Electron's Node.js
 * (e.g. via `electron-rebuild`), it shares the same ABI version number but has
 * incompatible V8 internals. This causes `new Database()` to hang indefinitely
 * rather than throwing an error, which the OS eventually kills with SIGKILL.
 *
 * This preflight spawns a short-lived child process to smoke-test the native
 * module. If it hangs or crashes, we exit with a clear error message.
 */
function verifyNativeModule(): void {
  try {
    execFileSync(
      process.execPath,
      ["-e", "require('better-sqlite3')(':memory:').close()"],
      { timeout: 5000, stdio: "ignore" },
    );
  } catch {
    console.error(
      "\n[FATAL] better-sqlite3 native module is incompatible with this Node.js version.\n" +
        "This usually happens after running the Electron desktop build, which recompiles\n" +
        "native modules against Electron's Node.js.\n\n" +
        "Fix: pnpm rebuild better-sqlite3\n" +
        " Or: pnpm run rebuild:node\n",
    );
    process.exit(1);
  }
}

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

  verifyNativeModule();

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
