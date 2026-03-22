import type { ToolDefinition, McpContext, McpToolResult } from "../../types/mcp.types.js";
import {
  getEpicByIdWithTickets,
  getEpicByProjectAndNumber,
  createEpic,
} from "../../stores/epic.store.js";
import { getDatabase } from "../../stores/db.js";
import { getProjectPrefixFromDb } from "../../stores/utils.js";
import type { EpicWithTickets } from "@potato-cannon/shared";

const EPIC_ID_PATTERN = /^EP-([A-Z]+)-(\d+)$/;

function resolveEpicByIdentifier(identifier: string): EpicWithTickets | null {
  const match = identifier.match(EPIC_ID_PATTERN);
  if (!match) {
    // Treat as UUID
    return getEpicByIdWithTickets(identifier);
  }

  const [, prefix, numberStr] = match;
  const epicNumber = parseInt(numberStr, 10);

  // Find the project matching this prefix
  const db = getDatabase();
  const projects = db
    .prepare("SELECT id FROM projects")
    .all() as { id: string }[];

  for (const project of projects) {
    const projectPrefix = getProjectPrefixFromDb(db, project.id);
    if (projectPrefix === prefix) {
      return getEpicByProjectAndNumber(project.id, epicNumber);
    }
  }

  return null;
}

function formatEpicResponse(epic: EpicWithTickets): string {
  const lines: string[] = [
    `# ${epic.identifier}: ${epic.title}`,
    ``,
    `**Status:** ${epic.status}`,
    `**Progress:** ${epic.doneCount}/${epic.ticketCount} tickets done`,
    ``,
  ];

  if (epic.description) {
    lines.push(`## Description`, ``, epic.description, ``);
  }

  if (epic.tickets.length > 0) {
    lines.push(`## Child Tickets`, ``);
    for (const ticket of epic.tickets) {
      lines.push(`- **${ticket.id}** — ${ticket.title} (${ticket.phase})`);
    }
  } else {
    lines.push(`_No tickets assigned to this epic._`);
  }

  return lines.join("\n");
}

export const epicTools: ToolDefinition[] = [
  {
    name: "get_epic",
    description:
      "Get epic details including title, description, status, and list of child tickets with their phases. Use this to understand the broader context of an initiative.",
    inputSchema: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          description:
            "Epic identifier (e.g., 'EP-POT-1') or epic UUID",
        },
      },
      required: ["identifier"],
    },
  },
  {
    name: "create_epic",
    description:
      "Create a new epic to group related tickets. Returns the created epic with its identifier. After creating, use create_ticket with the epicId to add tickets to this epic.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title for the epic",
        },
        description: {
          type: "string",
          description: "Description providing shared context for all tickets in this epic",
        },
      },
      required: ["title"],
    },
  },
];

export const epicHandlers: Record<
  string,
  (ctx: McpContext, args: Record<string, unknown>) => Promise<McpToolResult>
> = {
  get_epic: async (_ctx, args) => {
    const identifier = args.identifier as string;
    if (!identifier) {
      return {
        content: [{ type: "text", text: "Error: identifier is required" }],
        isError: true,
      };
    }

    const epic = resolveEpicByIdentifier(identifier);
    if (!epic) {
      return {
        content: [
          {
            type: "text",
            text: `Epic not found: ${identifier}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: formatEpicResponse(epic) }],
    };
  },

  create_epic: async (ctx, args) => {
    const title = args.title as string;
    if (!title) {
      return {
        content: [{ type: "text", text: "Error: title is required" }],
        isError: true,
      };
    }

    const description = args.description as string | undefined;
    const epic = createEpic(ctx.projectId, title, description);

    return {
      content: [{
        type: "text",
        text: `Epic created: ${epic.identifier} — ${epic.title}\nID: ${epic.id}\n\nUse this epicId when creating tickets: ${epic.id}`,
      }],
    };
  },
};
