import type Database from "better-sqlite3";

/**
 * Get the project prefix from the database for identifier generation.
 * Takes the display_name (or slug fallback), strips non-alphanumeric chars,
 * takes first 3 chars, uppercases. Falls back to "TKT".
 */
export function getProjectPrefixFromDb(db: Database.Database, projectId: string): string {
  const row = db.prepare("SELECT display_name, slug FROM projects WHERE id = ?").get(projectId) as { display_name: string; slug: string } | undefined;
  const name = row?.display_name || row?.slug || "TKT";
  return (
    name
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 3)
      .toUpperCase() || "TKT"
  );
}
