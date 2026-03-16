import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { ticketTools, ticketHandlers } from "../ticket.tools.js";
import type { McpContext, McpToolResult } from "../../../types/mcp.types.js";

// Mock fetch for testing
let mockFetchCalls: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}[] = [];

let mockFetchResponse: { ok: boolean; json: () => Promise<unknown>; statusText?: string } = {
  ok: true,
  json: async () => ({ id: "POT-123", title: "Test Ticket" }),
};

const originalFetch = globalThis.fetch;

describe("MCP create_ticket Tool - ticketNumber Support", () => {
  beforeEach(() => {
    mockFetchCalls = [];
    mockFetchResponse = {
      ok: true,
      json: async () => ({ id: "POT-123", title: "Test Ticket" }),
    };

    // Mock fetch globally
    globalThis.fetch = (async (url: string, options?: RequestInit) => {
      mockFetchCalls.push({
        url,
        method: options?.method,
        headers: options?.headers as Record<string, string>,
        body: options?.body as string,
      });
      return mockFetchResponse;
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("Tool Schema", () => {
    it("should include create_ticket tool", () => {
      const createTicketTool = ticketTools.find((t) => t.name === "create_ticket");
      assert.ok(createTicketTool, "create_ticket tool should exist");
    });

    it("should have ticketNumber in input schema properties", () => {
      const createTicketTool = ticketTools.find((t) => t.name === "create_ticket");
      assert.ok(createTicketTool, "create_ticket tool should exist");

      const properties = (createTicketTool.inputSchema as any).properties;
      assert.ok(
        properties.ticketNumber,
        "ticketNumber should be in input schema properties",
      );
    });

    it("should describe ticketNumber parameter correctly", () => {
      const createTicketTool = ticketTools.find((t) => t.name === "create_ticket");
      assert.ok(createTicketTool, "create_ticket tool should exist");

      const ticketNumberProp = (createTicketTool.inputSchema as any).properties.ticketNumber;
      assert.strictEqual(ticketNumberProp.type, "string");
      assert.ok(
        ticketNumberProp.description.includes("custom ticket number"),
        "Description should mention custom ticket number",
      );
    });

    it("should keep title as the only required field", () => {
      const createTicketTool = ticketTools.find((t) => t.name === "create_ticket");
      assert.ok(createTicketTool, "create_ticket tool should exist");

      const required = (createTicketTool.inputSchema as any).required;
      assert.deepStrictEqual(required, ["title"]);
    });
  });

  describe("Handler Function", () => {
    const mockContext: McpContext = {
      projectId: "test-project",
      ticketId: "POT-1",
      brainstormId: "",
      daemonUrl: "http://localhost:8443",
    };

    it("should create ticket with title only", async () => {
      const handler = ticketHandlers.create_ticket;
      const result = (await handler(mockContext, {
        title: "Test Ticket",
      })) as McpToolResult;

      assert.ok(result.content);
      assert.strictEqual(result.content[0].type, "text");

      // Verify fetch was called with correct payload
      assert.strictEqual(mockFetchCalls.length, 1);
      const call = mockFetchCalls[0];
      assert.strictEqual(call.method, "POST");
      const body = JSON.parse(call.body!);
      assert.strictEqual(body.title, "Test Ticket");
      assert.strictEqual(body.description, "");
      assert.ok(!body.brainstormId);
      assert.ok(!body.ticketNumber);
    });

    it("should create ticket with title and description", async () => {
      const handler = ticketHandlers.create_ticket;
      const result = (await handler(mockContext, {
        title: "Test Ticket",
        description: "Test Description",
      })) as McpToolResult;

      assert.ok(result.content);

      const call = mockFetchCalls[0];
      const body = JSON.parse(call.body!);
      assert.strictEqual(body.title, "Test Ticket");
      assert.strictEqual(body.description, "Test Description");
    });

    it("should create ticket with brainstormId", async () => {
      const handler = ticketHandlers.create_ticket;
      const result = (await handler(mockContext, {
        title: "Test Ticket",
        brainstormId: "brain_123",
      })) as McpToolResult;

      assert.ok(result.content);

      const call = mockFetchCalls[0];
      const body = JSON.parse(call.body!);
      assert.strictEqual(body.brainstormId, "brain_123");
    });

    it("should create ticket with ticketNumber", async () => {
      const handler = ticketHandlers.create_ticket;
      const result = (await handler(mockContext, {
        title: "Test Ticket",
        ticketNumber: "JIRA-42",
      })) as McpToolResult;

      assert.ok(result.content);

      const call = mockFetchCalls[0];
      const body = JSON.parse(call.body!);
      assert.strictEqual(body.ticketNumber, "JIRA-42");
      assert.ok(!body.brainstormId);
    });

    it("should create ticket with all parameters", async () => {
      const handler = ticketHandlers.create_ticket;
      const result = (await handler(mockContext, {
        title: "Test Ticket",
        description: "Test Description",
        brainstormId: "brain_123",
        ticketNumber: "JIRA-42",
      })) as McpToolResult;

      assert.ok(result.content);

      const call = mockFetchCalls[0];
      const body = JSON.parse(call.body!);
      assert.strictEqual(body.title, "Test Ticket");
      assert.strictEqual(body.description, "Test Description");
      assert.strictEqual(body.brainstormId, "brain_123");
      assert.strictEqual(body.ticketNumber, "JIRA-42");
    });

    it("should not include ticketNumber if not provided", async () => {
      const handler = ticketHandlers.create_ticket;
      await handler(mockContext, {
        title: "Test Ticket",
      });

      const call = mockFetchCalls[0];
      const body = JSON.parse(call.body!);
      assert.ok(!("ticketNumber" in body) || body.ticketNumber === undefined);
    });

    it("should use correct API endpoint", async () => {
      const handler = ticketHandlers.create_ticket;
      await handler(mockContext, {
        title: "Test Ticket",
      });

      const call = mockFetchCalls[0];
      assert.strictEqual(
        call.url,
        "http://localhost:8443/api/tickets/test-project",
      );
    });

    it("should set correct content-type header", async () => {
      const handler = ticketHandlers.create_ticket;
      await handler(mockContext, {
        title: "Test Ticket",
      });

      const call = mockFetchCalls[0];
      assert.ok(call.headers);
      assert.strictEqual(call.headers["Content-Type"], "application/json");
    });

    it("should return formatted response on success", async () => {
      mockFetchResponse.json = async () => ({
        id: "JIRA-42",
        title: "Test Ticket",
      });

      const handler = ticketHandlers.create_ticket;
      const result = (await handler(mockContext, {
        title: "Test Ticket",
        ticketNumber: "JIRA-42",
      })) as McpToolResult;

      assert.ok(result.content);
      assert.strictEqual(result.content[0].type, "text");
      assert.ok(result.content[0].text.includes("JIRA-42"));
      assert.ok(result.content[0].text.includes("Test Ticket"));
    });

    it("should handle error responses with error body", async () => {
      mockFetchResponse.ok = false;
      mockFetchResponse.statusText = "Bad Request";
      mockFetchResponse.json = async () => ({
        error: "Invalid ticket number format",
      });

      const handler = ticketHandlers.create_ticket;

      try {
        await handler(mockContext, {
          title: "Test Ticket",
          ticketNumber: "invalid!!!",
        });
        assert.fail("Should have thrown an error");
      } catch (err) {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes("Invalid ticket number format"));
      }
    });

    it("should handle error responses without error body", async () => {
      mockFetchResponse.ok = false;
      mockFetchResponse.statusText = "Internal Server Error";
      mockFetchResponse.json = async () => {
        throw new Error("Not JSON");
      };

      const handler = ticketHandlers.create_ticket;

      try {
        await handler(mockContext, {
          title: "Test Ticket",
        });
        assert.fail("Should have thrown an error");
      } catch (err) {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes("Internal Server Error"));
      }
    });
  });
});
