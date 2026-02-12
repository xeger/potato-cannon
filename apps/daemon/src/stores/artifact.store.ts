import type Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { getDatabase } from "./db.js";

// =============================================================================
// Types
// =============================================================================

/**
 * Artifact metadata stored in SQLite.
 * The actual file content is managed separately on disk.
 */
export interface StoredArtifact {
  id: string;
  ticketId: string;
  filename: string;
  type: string;
  description?: string;
  phase?: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Version metadata stored in SQLite.
 * The actual file content is managed separately on disk.
 */
export interface StoredArtifactVersion {
  id: string;
  artifactId: string;
  version: number;
  description?: string;
  filePath: string;
  createdAt: string;
}

export interface CreateStoredArtifactInput {
  ticketId: string;
  filename: string;
  type: string;
  description?: string;
  phase?: string;
  filePath: string;
}

export interface UpdateStoredArtifactInput {
  description?: string;
  phase?: string;
  filePath?: string;
}

export interface CreateStoredVersionInput {
  description?: string;
  filePath: string;
}

// =============================================================================
// Row Types
// =============================================================================

interface ArtifactRow {
  id: string;
  ticket_id: string;
  filename: string;
  type: string;
  description: string | null;
  phase: string | null;
  file_path: string;
  created_at: string;
  updated_at: string;
}

interface VersionRow {
  id: string;
  artifact_id: string;
  version: number;
  description: string | null;
  file_path: string;
  created_at: string;
}

// =============================================================================
// Row Mappers
// =============================================================================

function rowToArtifact(row: ArtifactRow): StoredArtifact {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    filename: row.filename,
    type: row.type,
    description: row.description || undefined,
    phase: row.phase || undefined,
    filePath: row.file_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToVersion(row: VersionRow): StoredArtifactVersion {
  return {
    id: row.id,
    artifactId: row.artifact_id,
    version: row.version,
    description: row.description || undefined,
    filePath: row.file_path,
    createdAt: row.created_at,
  };
}

// =============================================================================
// ArtifactStore Class
// =============================================================================

export class ArtifactStore {
  constructor(private db: Database.Database) {}

  // ---------------------------------------------------------------------------
  // Artifact CRUD
  // ---------------------------------------------------------------------------

  createArtifact(input: CreateStoredArtifactInput): StoredArtifact {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO artifacts (id, ticket_id, filename, type, description, phase, file_path, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.ticketId,
        input.filename,
        input.type,
        input.description || null,
        input.phase || null,
        input.filePath,
        now,
        now
      );

    return this.getArtifact(id)!;
  }

  getArtifact(id: string): StoredArtifact | null {
    const row = this.db
      .prepare("SELECT * FROM artifacts WHERE id = ?")
      .get(id) as ArtifactRow | undefined;

    return row ? rowToArtifact(row) : null;
  }

  getArtifactByFilename(ticketId: string, filename: string): StoredArtifact | null {
    const row = this.db
      .prepare("SELECT * FROM artifacts WHERE ticket_id = ? AND filename = ?")
      .get(ticketId, filename) as ArtifactRow | undefined;

    return row ? rowToArtifact(row) : null;
  }

  listArtifacts(ticketId: string): StoredArtifact[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM artifacts WHERE ticket_id = ? ORDER BY created_at"
      )
      .all(ticketId) as ArtifactRow[];

    return rows.map(rowToArtifact);
  }

  updateArtifact(id: string, updates: UpdateStoredArtifactInput): StoredArtifact | null {
    const artifact = this.getArtifact(id);
    if (!artifact) return null;

    const now = new Date().toISOString();
    const newDescription =
      updates.description !== undefined
        ? updates.description
        : artifact.description || null;
    const newPhase =
      updates.phase !== undefined ? updates.phase : artifact.phase || null;
    const newFilePath = updates.filePath ?? artifact.filePath;

    this.db
      .prepare(
        "UPDATE artifacts SET description = ?, phase = ?, file_path = ?, updated_at = ? WHERE id = ?"
      )
      .run(newDescription, newPhase, newFilePath, now, id);

    return this.getArtifact(id);
  }

  deleteArtifact(id: string): boolean {
    // Versions are deleted automatically via CASCADE
    const result = this.db
      .prepare("DELETE FROM artifacts WHERE id = ?")
      .run(id);
    return result.changes > 0;
  }

  // ---------------------------------------------------------------------------
  // Version Management
  // ---------------------------------------------------------------------------

  addVersion(artifactId: string, input: CreateStoredVersionInput): StoredArtifactVersion | null {
    const artifact = this.getArtifact(artifactId);
    if (!artifact) return null;

    const id = randomUUID();
    const now = new Date().toISOString();

    // Get next version number for this artifact
    const maxRow = this.db
      .prepare(
        "SELECT COALESCE(MAX(version), 0) as max_version FROM artifact_versions WHERE artifact_id = ?"
      )
      .get(artifactId) as { max_version: number };
    const version = maxRow.max_version + 1;

    this.db
      .prepare(
        `INSERT INTO artifact_versions (id, artifact_id, version, description, file_path, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(id, artifactId, version, input.description || null, input.filePath, now);

    return this.getVersion(id);
  }

  getVersion(id: string): StoredArtifactVersion | null {
    const row = this.db
      .prepare("SELECT * FROM artifact_versions WHERE id = ?")
      .get(id) as VersionRow | undefined;

    return row ? rowToVersion(row) : null;
  }

  getVersions(artifactId: string): StoredArtifactVersion[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM artifact_versions WHERE artifact_id = ? ORDER BY version"
      )
      .all(artifactId) as VersionRow[];

    return rows.map(rowToVersion);
  }

  getLatestVersion(artifactId: string): StoredArtifactVersion | null {
    const row = this.db
      .prepare(
        "SELECT * FROM artifact_versions WHERE artifact_id = ? ORDER BY version DESC LIMIT 1"
      )
      .get(artifactId) as VersionRow | undefined;

    return row ? rowToVersion(row) : null;
  }
}

// =============================================================================
// Factory & Convenience Functions
// =============================================================================

export function createArtifactStore(db: Database.Database): ArtifactStore {
  return new ArtifactStore(db);
}

// Singleton convenience functions
export function createStoredArtifact(input: CreateStoredArtifactInput): StoredArtifact {
  return new ArtifactStore(getDatabase()).createArtifact(input);
}

export function getStoredArtifact(id: string): StoredArtifact | null {
  return new ArtifactStore(getDatabase()).getArtifact(id);
}

export function getStoredArtifactByFilename(
  ticketId: string,
  filename: string
): StoredArtifact | null {
  return new ArtifactStore(getDatabase()).getArtifactByFilename(
    ticketId,
    filename
  );
}

export function listStoredArtifacts(ticketId: string): StoredArtifact[] {
  return new ArtifactStore(getDatabase()).listArtifacts(ticketId);
}

export function updateStoredArtifact(
  id: string,
  updates: UpdateStoredArtifactInput
): StoredArtifact | null {
  return new ArtifactStore(getDatabase()).updateArtifact(id, updates);
}

export function deleteStoredArtifact(id: string): boolean {
  return new ArtifactStore(getDatabase()).deleteArtifact(id);
}

export function addStoredArtifactVersion(
  artifactId: string,
  input: CreateStoredVersionInput
): StoredArtifactVersion | null {
  return new ArtifactStore(getDatabase()).addVersion(artifactId, input);
}

export function getStoredArtifactVersions(artifactId: string): StoredArtifactVersion[] {
  return new ArtifactStore(getDatabase()).getVersions(artifactId);
}

export function getLatestStoredArtifactVersion(
  artifactId: string
): StoredArtifactVersion | null {
  return new ArtifactStore(getDatabase()).getLatestVersion(artifactId);
}
