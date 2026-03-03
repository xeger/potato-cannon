import { WebClient } from "@slack/web-api";

export class SlackApi {
  private client: WebClient;

  constructor(botToken: string) {
    this.client = new WebClient(botToken);
  }

  /**
   * Discover a channel the bot is a member of.
   * Prefers non-#general channels; falls back to #general if it's the only one.
   * Returns { id, name } or null if the bot isn't in any channel.
   * Requires the `channels:read` scope.
   */
  async discoverChannel(): Promise<{ id: string; name: string } | null> {
    const result = await this.client.users.conversations({
      types: "public_channel",
      exclude_archived: true,
      limit: 100,
    });

    const channels = result.channels ?? [];
    // Prefer a non-#general channel; fall back to #general
    const match = channels.find((ch) => !ch.is_general) ?? channels[0];
    if (match?.id && match?.name) {
      return { id: match.id, name: match.name };
    }
    return null;
  }

  /**
   * Post a message to a channel. If thread_ts is provided, replies in-thread.
   * Returns the message timestamp (ts), which serves as the message ID in Slack.
   */
  async postMessage(
    channel: string,
    text: string,
    options?: { thread_ts?: string },
  ): Promise<string> {
    const result = await this.client.chat.postMessage({
      channel,
      text,
      thread_ts: options?.thread_ts,
    });
    if (!result.ts) {
      throw new Error("Failed to post message: no ts returned");
    }
    return result.ts;
  }
}
