// src/server/routes/templates.routes.ts
import type { Express, Request, Response } from 'express';
import {
  listTemplates,
  getTemplate,
  getTemplateWithFullPhases,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  getDefaultTemplate,
  getAgentPrompt,
  saveAgentPrompt,
} from '../../stores/template.store.js';

export function registerTemplateRoutes(app: Express): void {
  // GET /api/templates - List all templates
  app.get('/api/templates', async (_req: Request, res: Response) => {
    try {
      const templates = await listTemplates();
      res.json(templates);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/templates/default - Get default template
  app.get('/api/templates/default', async (_req: Request, res: Response) => {
    try {
      const template = await getDefaultTemplate();
      res.json(template);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/templates/:name - Get template detail
  app.get('/api/templates/:name', async (req: Request, res: Response) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const includeBoundary = req.query.full === 'true';

      const template = includeBoundary
        ? await getTemplateWithFullPhases(name)
        : await getTemplate(name);

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }
      res.json(template);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // POST /api/templates - Create new template
  app.post('/api/templates', async (req: Request, res: Response) => {
    try {
      const { name, description, phases } = req.body;
      if (!name || !description) {
        res.status(400).json({ error: 'name and description required' });
        return;
      }
      const template = await createTemplate(name, description, phases || []);
      res.status(201).json(template);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // PUT /api/templates/:name - Update template (auto-increments version)
  app.put('/api/templates/:name', async (req: Request, res: Response) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const { description, phases } = req.body;
      const template = await updateTemplate(name, { description, phases });
      res.json(template);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // DELETE /api/templates/:name - Delete template
  app.delete('/api/templates/:name', async (req: Request, res: Response) => {
    try {
      const name = decodeURIComponent(req.params.name);
      await deleteTemplate(name);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // POST /api/templates/:name/default - Set as default template
  app.post('/api/templates/:name/default', async (req: Request, res: Response) => {
    try {
      const name = decodeURIComponent(req.params.name);
      await setDefaultTemplate(name);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/templates/:name/agents/*path - Read agent prompt
  app.get('/api/templates/:name/agents/*', async (req: Request, res: Response) => {
    try {
      const templateName = decodeURIComponent(req.params.name);
      const agentPath = 'agents/' + req.params[0];
      const content = await getAgentPrompt(templateName, agentPath);
      res.type('text/plain').send(content);
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  });

  // PUT /api/templates/:name/agents/*path - Save agent prompt
  app.put('/api/templates/:name/agents/*', async (req: Request, res: Response) => {
    try {
      const templateName = decodeURIComponent(req.params.name);
      const agentPath = 'agents/' + req.params[0];
      const content = req.body;
      await saveAgentPrompt(templateName, agentPath, content);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
}
