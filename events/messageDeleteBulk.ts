import {
  Collection,
  DiscordAPIError,
  Message,
  PartialMessage,
  Snowflake,
} from "discord.js";
import db from "../mongo.js";
import Logger from "../logger.js";

const mongo = db.db("bot");

export default async function (
  messages: Collection<Snowflake, Message | PartialMessage>,
) {
  const firstMessage = messages.first();
  if (!firstMessage || firstMessage.channel.isDMBased() || !firstMessage.guild)
    return;
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: {
        $in: [firstMessage.channel.id, firstMessage.channel.parent?.id],
      },
      log: { $in: ["delete", null] },
    })
    .catch(Logger);
  if (ignoreData) return;
  const logChannel = await mongo
    .collection("log_channels")
    .findOne(
      { guild: firstMessage.guildId, type: "delete" },
      { projection: { webhook: 1 } },
    );

  if (!logChannel) return;
  let uploadBody = `${new Intl.DateTimeFormat(
    messages.first()?.guild?.preferredLocale ?? "en-US",
    {
      minute: "2-digit",
      hour: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(Date.now())}`;

  messages.each(function (msg) {
    uploadBody += `\n\n${msg.author?.username ?? "[Unknown]"} (${
      msg.author?.id ?? "Unknown"
    }): ${msg.content}`;
  });

  const uploadName = `${Date.now()}${Math.round(Math.random() * 1000000)}.txt`;
  const webhook = await messages
    .first()
    ?.client.fetchWebhook(
      logChannel.webhook.match(/\d{16,}/)[0],
      logChannel.webhook.replace(
        /https:\/\/discord\.com\/api\/?v?\d*?\/webhooks\/\d{16,}\//,
        "",
      ),
    )
    .catch((err: DiscordAPIError) => err);

  if (!webhook) return;

  if (webhook instanceof DiscordAPIError) {
    if (webhook.status === 404) {
      await mongo
        .collection("log_channels")
        .deleteOne({ guild: firstMessage.guildId, type: "delete" })
        .catch(Logger);
    }
    return;
  }

  await webhook
    .send({
      files: [{ attachment: Buffer.from(uploadBody), name: uploadName }],
    })
    .catch(console.error);
}
