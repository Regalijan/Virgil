import { type Guild } from "discord.js";
import logger from "./logger.js";

export default async function (
  webhookUrl: string,
  guild: Guild,
  messageId?: string,
): Promise<void> {
  const webhookParts = webhookUrl
    .replace(/https:\/\/discord.com\/api\/?v?\d{0,2}?\/webhooks\//, "")
    .split("/");
  const webhook = await guild.client
    .fetchWebhook(webhookParts[0], webhookParts[1])
    .catch(console.error);

  if (!webhook) return;

  try {
    if (messageId) {
      await webhook.deleteMessage(messageId);
    } else await webhook.delete("Log removed");
  } catch (e) {
    logger(e);
  }
}
