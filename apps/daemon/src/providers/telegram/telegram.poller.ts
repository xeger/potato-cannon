// src/providers/telegram/telegram.poller.ts

export class TelegramPoller {
  private running = false;
  private offset = 0;
  private abortController: AbortController | null = null;

  constructor(
    private botToken: string,
    private onUpdate: (update: unknown) => Promise<void>
  ) {}

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.poll();
  }

  stop(): void {
    this.running = false;
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async poll(): Promise<void> {
    while (this.running) {
      try {
        this.abortController = new AbortController();
        const updates = await this.getUpdates();

        for (const update of updates) {
          const u = update as { update_id: number };
          this.offset = u.update_id + 1;

          try {
            await this.onUpdate(update);
          } catch (error) {
            console.error('[TelegramPoller] Error handling update:', (error as Error).message);
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('[TelegramPoller] Poll error:', (error as Error).message);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
  }

  private async getUpdates(): Promise<unknown[]> {
    const params = new URLSearchParams({
      timeout: '30',
      offset: this.offset.toString(),
    });

    const response = await fetch(
      `https://api.telegram.org/bot${this.botToken}/getUpdates?${params}`,
      { signal: this.abortController?.signal }
    );

    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }

    return result.result;
  }
}
