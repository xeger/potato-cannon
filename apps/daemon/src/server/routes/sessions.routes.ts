import type { Express, Request, Response } from 'express';
import { eventBus } from '../../utils/event-bus.js';
import type { SessionService } from '../../services/session/index.js';

export function registerSessionRoutes(app: Express, sessionService: SessionService): void {
  // List sessions
  app.get('/api/sessions', async (_req: Request, res: Response) => {
    try {
      const sessions = await sessionService.listSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get session log
  app.get('/api/sessions/:id', async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.id;
      const log = await sessionService.getSessionLog(sessionId);
      res.json(log);
    } catch (error) {
      res.status(404).json({ error: 'Session not found' });
    }
  });

  // Live session output (SSE)
  app.get('/api/sessions/:id/live', (req: Request, res: Response) => {
    const sessionId = req.params.id;

    if (!sessionService.isActive(sessionId)) {
      res.status(404).json({ error: 'Session not active' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const handler = (data: { sessionId: string; event: unknown }) => {
      if (data.sessionId === sessionId) {
        res.write(`data: ${JSON.stringify(data.event)}\n\n`);
      }
    };

    eventBus.on('session:output', handler);

    res.on('close', () => {
      eventBus.off('session:output', handler);
    });
  });

  // Stop session
  app.post('/api/sessions/:id/stop', (req: Request, res: Response) => {
    const sessionId = req.params.id;
    const stopped = sessionService.stopSession(sessionId);
    res.json({ ok: stopped });
  });
}
