// src/stores/chat-threads.store.ts

import fs from "fs/promises";
import path from "path";
import { TASKS_DIR, BRAINSTORMS_DIR } from "../config/paths.js";
import type {
  ChatContext,
  ChatThreadsFile,
  ProviderThreadInfo,
} from "../providers/chat-provider.types.js";

function getThreadsPath(context: ChatContext): string {
  const safeProject = context.projectId.replace(/\//g, "__");

  if (context.brainstormId) {
    return path.join(
      BRAINSTORMS_DIR,
      safeProject,
      context.brainstormId,
      "chat-threads.json",
    );
  }

  if (context.ticketId) {
    return path.join(
      TASKS_DIR,
      safeProject,
      context.ticketId,
      "chat-threads.json",
    );
  }

  if (context.epicId) {
    return path.join(
      BRAINSTORMS_DIR,
      safeProject,
      `epic_${context.epicId}`,
      "chat-threads.json",
    );
  }

  throw new Error("ChatContext must have either ticketId, brainstormId, or epicId");
}

export async function loadThreads(
  context: ChatContext,
): Promise<ChatThreadsFile | null> {
  const filePath = getThreadsPath(context);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as ChatThreadsFile;
  } catch {
    return null;
  }
}

export async function saveThreads(
  context: ChatContext,
  threads: ChatThreadsFile,
): Promise<void> {
  const filePath = getThreadsPath(context);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(threads, null, 2));
}

export async function getProviderThread(
  context: ChatContext,
  providerId: string,
): Promise<ProviderThreadInfo | null> {
  const file = await loadThreads(context);
  if (!file) return null;
  return file.threads.find((t) => t.providerId === providerId) || null;
}

export async function setProviderThread(
  context: ChatContext,
  thread: ProviderThreadInfo,
): Promise<void> {
  let file = await loadThreads(context);

  if (!file) {
    file = {
      threads: [],
      createdAt: new Date().toISOString(),
    };
  }

  const existingIndex = file.threads.findIndex(
    (t) => t.providerId === thread.providerId,
  );
  if (existingIndex >= 0) {
    file.threads[existingIndex] = thread;
  } else {
    file.threads.push(thread);
  }

  await saveThreads(context, file);
}

export async function getAllThreads(
  context: ChatContext,
): Promise<ProviderThreadInfo[]> {
  const file = await loadThreads(context);
  return file?.threads || [];
}

/**
 * Scan all tickets and brainstorms to build a complete thread mapping.
 * Returns a map of "projectId:ticketId" or "projectId:brainstormId" -> ProviderThreadInfo[]
 */
export async function scanAllChatThreads(): Promise<
  Map<string, { context: ChatContext; threads: ProviderThreadInfo[] }>
> {
  const result = new Map<
    string,
    { context: ChatContext; threads: ProviderThreadInfo[] }
  >();

  // Scan tickets
  try {
    const projectDirs = await fs.readdir(TASKS_DIR);
    for (const projectDir of projectDirs) {
      const projectPath = path.join(TASKS_DIR, projectDir);
      const stat = await fs.stat(projectPath);
      if (!stat.isDirectory()) continue;

      const ticketDirs = await fs.readdir(projectPath);
      for (const ticketDir of ticketDirs) {
        const threadsPath = path.join(
          projectPath,
          ticketDir,
          "chat-threads.json",
        );
        try {
          const data = await fs.readFile(threadsPath, "utf-8");
          const file = JSON.parse(data) as ChatThreadsFile;
          const projectId = projectDir.replace(/__/g, "/");
          const context: ChatContext = { projectId, ticketId: ticketDir };
          result.set(`${projectId}:${ticketDir}`, {
            context,
            threads: file.threads,
          });
        } catch {
          // No chat-threads.json for this ticket
        }
      }
    }
  } catch {
    // TASKS_DIR may not exist
  }

  // Scan brainstorms
  try {
    const projectDirs = await fs.readdir(BRAINSTORMS_DIR);
    for (const projectDir of projectDirs) {
      const projectPath = path.join(BRAINSTORMS_DIR, projectDir);
      const stat = await fs.stat(projectPath);
      if (!stat.isDirectory()) continue;

      const brainstormDirs = await fs.readdir(projectPath);
      for (const brainstormDir of brainstormDirs) {
        const threadsPath = path.join(
          projectPath,
          brainstormDir,
          "chat-threads.json",
        );
        try {
          const data = await fs.readFile(threadsPath, "utf-8");
          const file = JSON.parse(data) as ChatThreadsFile;
          const projectId = projectDir.replace(/__/g, "/");
          const context: ChatContext = {
            projectId,
            brainstormId: brainstormDir,
          };
          result.set(`${projectId}:${brainstormDir}`, {
            context,
            threads: file.threads,
          });
        } catch {
          // No chat-threads.json for this brainstorm
        }
      }
    }
  } catch {
    // BRAINSTORMS_DIR may not exist
  }

  return result;
}
