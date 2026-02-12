import type { Express, Request, Response } from 'express';
import type { GlobalConfig } from '../../types/config.types.js';

export function registerTelegramRoutes(
  app: Express,
  getGlobalConfig: () => GlobalConfig | null,
  saveConfig: (config: GlobalConfig) => Promise<void>
): void {
  // Get telegram config
  app.get('/api/config/telegram', (_req: Request, res: Response) => {
    const globalConfig = getGlobalConfig();
    const config = globalConfig?.telegram;
    res.json({
      configured: !!(config?.botToken && config?.userId),
      hasForumGroup: !!config?.forumGroupId,
      mode: config?.mode || 'auto',
    });
  });

  // Update forum group
  app.put('/api/config/telegram/forum', async (req: Request, res: Response) => {
    try {
      const { forumGroupId } = req.body as { forumGroupId?: string };
      const globalConfig = getGlobalConfig();

      if (!globalConfig) {
        res.status(500).json({ error: 'No global config' });
        return;
      }

      if (!globalConfig.telegram) {
        globalConfig.telegram = {
          botToken: '',
          userId: '',
          mode: 'auto',
        };
      }

      globalConfig.telegram.forumGroupId = forumGroupId || '';
      await saveConfig(globalConfig);

      res.json({
        ok: true,
        forumGroupId: globalConfig.telegram.forumGroupId,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Telegram webhook - now handled by TelegramProvider polling
  // Webhook support can be added later if needed
  app.post('/telegram/webhook', async (_req: Request, res: Response) => {
    res.json({ ok: true, message: 'Webhook endpoint deprecated - using polling mode' });
  });
}
