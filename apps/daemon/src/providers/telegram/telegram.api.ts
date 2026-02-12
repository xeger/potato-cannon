// src/providers/telegram/telegram.api.ts

export interface TelegramConfig {
  botToken: string;
  userId: string;
  forumGroupId?: string;
}

export class TelegramApi {
  constructor(private config: TelegramConfig) {}

  private get baseUrl(): string {
    return `https://api.telegram.org/bot${this.config.botToken}`;
  }

  async sendMessage(
    chatId: string,
    text: string,
    options: {
      messageThreadId?: number;
      replyMarkup?: unknown;
      parseMode?: string;
    } = {}
  ): Promise<unknown> {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: options.parseMode || 'Markdown',
    };

    if (options.messageThreadId) {
      body.message_thread_id = options.messageThreadId;
    }

    if (options.replyMarkup) {
      body.reply_markup = JSON.stringify(options.replyMarkup);
    }

    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }

    return result;
  }

  async createForumTopic(
    chatId: string,
    name: string
  ): Promise<{ message_thread_id: number; name: string }> {
    const response = await fetch(`${this.baseUrl}/createForumTopic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, name }),
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }

    return result.result;
  }

  async getUpdates(offset?: number, timeout = 30): Promise<unknown[]> {
    const params = new URLSearchParams({
      timeout: timeout.toString(),
    });
    if (offset !== undefined) {
      params.set('offset', offset.toString());
    }

    const response = await fetch(`${this.baseUrl}/getUpdates?${params}`);
    const result = await response.json();

    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }

    return result.result;
  }
}
