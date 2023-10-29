import { Guild } from "discord.js";

export default async function (
  webhookUrl: string,
  messageId: string,
  guild: Guild,
): Promise<void> {
  const webhookParts = webhookUrl
    .replace(/https:\/\/discord.com\/api\/?v?\d{0,2}?\/webhooks\//, "")
    .split("/");
  const webhook = await guild.client
    .fetchWebhook(webhookParts[0], webhookParts[1])
    .catch(console.error);
  await webhook?.delete(messageId).catch(console.error);
}
