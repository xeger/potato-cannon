// src/stores/ticket-log.store.ts
import fs from "fs/promises";
import path from "path";
import { TASKS_DIR } from "../config/paths.js";

function getTicketDir(projectId: string, ticketId: string): string {
  const safeId = projectId.replace(/\//g, "__");
  return path.join(TASKS_DIR, safeId, ticketId);
}

function getTicketLogsDir(projectId: string, ticketId: string): string {
  return path.join(getTicketDir(projectId, ticketId), "logs");
}

function getTicketLogPath(projectId: string, ticketId: string): string {
  return path.join(getTicketLogsDir(projectId, ticketId), "daemon.log");
}

/**
 * Append a log entry to the ticket's log file.
 * Format: [timestamp] message
 */
export async function appendTicketLog(
  projectId: string,
  ticketId: string,
  message: string,
): Promise<void> {
  const logsDir = getTicketLogsDir(projectId, ticketId);
  const logPath = getTicketLogPath(projectId, ticketId);
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;

  try {
    await fs.mkdir(logsDir, { recursive: true });
    await fs.appendFile(logPath, entry);
  } catch (err) {
    console.error(
      `[TicketLog] Failed to write log for ${ticketId}: ${(err as Error).message}`,
    );
  }
}

/**
 * Read ticket logs.
 */
export async function readTicketLogs(
  projectId: string,
  ticketId: string,
): Promise<string> {
  const logPath = getTicketLogPath(projectId, ticketId);
  try {
    return await fs.readFile(logPath, "utf-8");
  } catch {
    return "";
  }
}
