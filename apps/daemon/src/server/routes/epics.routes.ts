import type { Express, Request, Response } from "express";
import {
  listEpics,
  getEpicById,
  getEpicByIdWithTickets,
  createEpic,
  updateEpic,
  deleteEpic,
  assignTicketToEpic,
  unassignTicketFromEpic,
  ensureEpicConversation,
} from "../../stores/epic.store.js";
import { getTicket } from "../../stores/ticket.store.js";
import { getMessages, addMessage, getPendingQuestion, answerQuestion } from "../../stores/conversation.store.js";
import { writeResponse } from "../../stores/chat.store.js";
import { eventBus } from "../../utils/event-bus.js";
import type { SessionService } from "../../services/session/index.js";
import type { Project } from "../../types/config.types.js";

export function registerEpicRoutes(
  app: Express,
  sessionService: SessionService,
  getProjects: () => Map<string, Project>
): void {
  // GET /api/projects/:projectId/epics — List all epics for a project
  app.get("/api/projects/:projectId/epics", (req: Request, res: Response) => {
    try {
      const projectId = decodeURIComponent(req.params.projectId);
      const epics = listEpics(projectId);
      res.json(epics);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/projects/:projectId/epics/:epicId — Get epic details with child tickets
  app.get("/api/projects/:projectId/epics/:epicId", (req: Request, res: Response) => {
    try {
      const epicId = decodeURIComponent(req.params.epicId);
      const epic = getEpicByIdWithTickets(epicId);
      if (!epic) {
        res.status(404).json({ error: "Epic not found" });
        return;
      }
      res.json(epic);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/projects/:projectId/epics — Create a new epic
  app.post("/api/projects/:projectId/epics", (req: Request, res: Response) => {
    try {
      const projectId = decodeURIComponent(req.params.projectId);
      const { title, description } = req.body as {
        title?: string;
        description?: string;
      };

      if (!title) {
        res.status(400).json({ error: "Missing title" });
        return;
      }

      const epic = createEpic(projectId, title, description);
      eventBus.emit("epic:created", { projectId, epic });
      res.json(epic);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // PUT /api/projects/:projectId/epics/:epicId — Update epic title/description
  app.put("/api/projects/:projectId/epics/:epicId", (req: Request, res: Response) => {
    try {
      const epicId = decodeURIComponent(req.params.epicId);
      const { title, description } = req.body as {
        title?: string;
        description?: string;
      };

      const epic = updateEpic(epicId, { title, description });
      if (!epic) {
        res.status(404).json({ error: "Epic not found" });
        return;
      }

      const projectId = decodeURIComponent(req.params.projectId);
      eventBus.emit("epic:updated", { projectId, epic });
      res.json(epic);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // DELETE /api/projects/:projectId/epics/:epicId — Delete an epic (unlinks tickets)
  app.delete("/api/projects/:projectId/epics/:epicId", (req: Request, res: Response) => {
    try {
      const projectId = decodeURIComponent(req.params.projectId);
      const epicId = decodeURIComponent(req.params.epicId);

      const deleted = deleteEpic(epicId);
      if (!deleted) {
        res.status(404).json({ error: "Epic not found" });
        return;
      }

      eventBus.emit("epic:deleted", { projectId, epicId });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // PUT /api/projects/:projectId/tickets/:ticketId/epic — Assign/unassign ticket to epic
  app.put("/api/projects/:projectId/tickets/:ticketId/epic", (req: Request, res: Response) => {
    try {
      const projectId = decodeURIComponent(req.params.projectId);
      const ticketId = decodeURIComponent(req.params.ticketId);
      const { epicId } = req.body as { epicId: string | null };

      // Verify ticket belongs to this project
      let ticket;
      try {
        ticket = getTicket(projectId, ticketId);
      } catch {
        res.status(404).json({ error: "Ticket not found in this project" });
        return;
      }

      // Capture previous epicId BEFORE mutation for SSE
      const previousEpicId = ticket.epicId || null;

      if (epicId !== null) {
        // Validate epic exists and belongs to same project
        const epic = getEpicById(epicId);
        if (!epic) {
          res.status(404).json({ error: "Epic not found" });
          return;
        }

        if (epic.projectId !== projectId) {
          res.status(400).json({ error: "Cannot assign ticket to an epic in a different project" });
          return;
        }

        assignTicketToEpic(ticketId, epicId);
      } else {
        unassignTicketFromEpic(ticketId);
      }

      // Emit ticket:updated
      eventBus.emit("ticket:updated", { projectId, ticketId });

      // Emit epic:updated for the NEW epic
      if (epicId !== null) {
        const updatedEpic = getEpicById(epicId);
        if (updatedEpic) {
          eventBus.emit("epic:updated", { projectId, epic: updatedEpic });
        }
      }

      // Emit epic:updated for the PREVIOUS epic (if different)
      if (previousEpicId && previousEpicId !== epicId) {
        const previousEpic = getEpicById(previousEpicId);
        if (previousEpic) {
          eventBus.emit("epic:updated", { projectId, epic: previousEpic });
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/projects/:projectId/epics/:epicId/chat — Start/send a chat message
  app.post("/api/projects/:projectId/epics/:epicId/chat", async (req: Request, res: Response) => {
    try {
      const projectId = decodeURIComponent(req.params.projectId);
      const epicId = decodeURIComponent(req.params.epicId);
      const { message } = req.body as { message?: string };

      if (!message) {
        res.status(400).json({ error: "Missing message" });
        return;
      }

      const epic = getEpicById(epicId);
      if (!epic) {
        res.status(404).json({ error: "Epic not found" });
        return;
      }

      const projects = getProjects();
      const project = projects.get(projectId);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      // Ensure conversation exists
      const conversationId = ensureEpicConversation(epicId, projectId);

      // Check if there's a pending question — if so, this is a response
      const pendingQuestion = getPendingQuestion(conversationId);
      if (pendingQuestion) {
        answerQuestion(pendingQuestion.id);
        writeResponse(projectId, epicId, { answer: message });
      }

      // Save user message
      addMessage(conversationId, {
        type: "user",
        text: message,
      });

      // Spawn epic chat session
      const sessionId = await sessionService.spawnForEpicChat(
        projectId,
        epicId,
        project.path,
        pendingQuestion ? undefined : message,
      );

      eventBus.emit("epic:updated", { projectId, epic: getEpicById(epicId) });

      res.json({ ok: true, sessionId });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/projects/:projectId/epics/:epicId/chat/messages — Get epic chat history
  app.get("/api/projects/:projectId/epics/:epicId/chat/messages", (req: Request, res: Response) => {
    try {
      const epicId = decodeURIComponent(req.params.epicId);
      const epic = getEpicById(epicId);

      if (!epic) {
        res.status(404).json({ error: "Epic not found" });
        return;
      }

      if (!epic.conversationId) {
        res.json({ messages: [] });
        return;
      }

      const rawMessages = getMessages(epic.conversationId);
      const messages = rawMessages.map((msg) => ({
        ...msg,
        conversationId: msg.id,
      }));

      res.json({ messages });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
}
