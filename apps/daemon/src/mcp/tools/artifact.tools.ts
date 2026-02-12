import fs from "fs/promises";
import path from "path";
import { TASKS_DIR } from "../../config/paths.js";
import type {
  ToolDefinition,
  McpContext,
  McpToolResult,
} from "../../types/mcp.types.js";
import type { ArtifactManifest } from "../../types/index.js";

export const artifactTools: ToolDefinition[] = [
  {
    name: "list_artifacts",
    description:
      "List all artifacts attached to the current ticket. Returns filename, type, description, savedAt, and phase for each artifact.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_artifact",
    description:
      "Get the content and metadata of a specific artifact by filename.",
    inputSchema: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          description: "The artifact filename (e.g., 'refinement.md')",
        },
      },
      required: ["filename"],
    },
  },
];

interface ArtifactListItem {
  filename: string;
  type: string;
  description: string;
  savedAt: string;
  phase?: string;
}

interface ArtifactContent {
  filename: string;
  type: string;
  description: string;
  savedAt: string;
  phase?: string;
  content: string | null;
}

function getArtifactsDir(ctx: McpContext): string {
  const safeProject = ctx.projectId.replace(/\//g, "__");
  return path.join(TASKS_DIR, safeProject, ctx.ticketId, "artifacts");
}

async function listArtifacts(ctx: McpContext): Promise<ArtifactListItem[]> {
  const artifactsDir = getArtifactsDir(ctx);
  const manifestPath = path.join(artifactsDir, "manifest.json");

  try {
    const manifestContent = await fs.readFile(manifestPath, "utf-8");
    const manifest: ArtifactManifest = JSON.parse(manifestContent);

    return Object.entries(manifest).map(([filename, entry]) => ({
      filename,
      type: entry.type,
      description: entry.description || "",
      savedAt: entry.savedAt,
      phase: entry.phase,
    }));
  } catch (error) {
    // No manifest = no artifacts
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function getArtifact(
  ctx: McpContext,
  filename: string,
): Promise<ArtifactContent> {
  const artifactsDir = getArtifactsDir(ctx);
  const manifestPath = path.join(artifactsDir, "manifest.json");

  // Read manifest
  let manifest: ArtifactManifest;
  try {
    const manifestContent = await fs.readFile(manifestPath, "utf-8");
    manifest = JSON.parse(manifestContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`No artifacts found for ticket ${ctx.ticketId}`);
    }
    throw error;
  }

  // Check if artifact exists in manifest
  const entry = manifest[filename];
  if (!entry) {
    const available = Object.keys(manifest).join(", ");
    throw new Error(
      `Artifact '${filename}' not found. Available: ${available || "none"}`,
    );
  }

  // Read content
  const artifactPath = path.join(artifactsDir, filename);
  let content: string | null = null;
  try {
    content = await fs.readFile(artifactPath, "utf-8");
  } catch (error) {
    // File might be binary or missing
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      content = null; // Binary or unreadable
    }
  }

  return {
    filename,
    type: entry.type,
    description: entry.description || "",
    savedAt: entry.savedAt,
    phase: entry.phase,
    content,
  };
}

export const artifactHandlers: Record<
  string,
  (ctx: McpContext, args: Record<string, unknown>) => Promise<McpToolResult>
> = {
  list_artifacts: async (ctx) => {
    const artifacts = await listArtifacts(ctx);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ artifacts }, null, 2),
        },
      ],
    };
  },
  get_artifact: async (ctx, args) => {
    const filename = args.filename as string;
    if (!filename) {
      throw new Error("filename is required");
    }
    const artifact = await getArtifact(ctx, filename);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(artifact, null, 2),
        },
      ],
    };
  },
};