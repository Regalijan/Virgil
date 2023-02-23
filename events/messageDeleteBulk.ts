import {
  ChannelType,
  Collection,
  DiscordAPIError,
  Message,
  PartialMessage,
  Snowflake,
} from "discord.js";
import db from "../mongo";
import Logger from "../logger";
import { join } from "path";
import { unlink, writeFile } from "fs/promises";

const mongo = db.db("bot");

module.exports = async function (
  messages: Collection<Snowflake, Message | PartialMessage>
) {
  const firstMessage = messages.first();
  if (
    !firstMessage ||
    firstMessage.channel.type === ChannelType.DM ||
    !firstMessage.guild
  )
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
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: messages.first()?.guild?.id })
    .catch(Logger);
  if (!settings?.deleteLogChannelWebhook) return;
  let fileBody = `${new Intl.DateTimeFormat(
    messages.first()?.guild?.preferredLocale ?? "en-US",
    {
      minute: "2-digit",
      hour: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(Date.now())}`;
  messages.each(function (msg) {
    fileBody += `\n\n${msg.author?.tag ?? "Unknown#0000"} (${
      msg.author?.id ?? "Unknown"
    }): ${msg.content}`;
  });
  const filePath = join(
    __dirname,
    Date.now().toString() +
      Math.round(Math.random() * 1000000).toString() +
      ".txt"
  );

  await writeFile(filePath, fileBody).catch(Logger);

  const webhook = await messages
    .first()
    ?.client.fetchWebhook(
      settings.deleteLogChannelWebhook.match(/\d{16,}/)[0],
      settings.deleteLogChannelWebhook.replace(
        /https:\/\/discorda?p?p?\.com\/api\/?v?\d*?\/webhooks\/\d{16,}\//,
        ""
      )
    )
    .catch((err: DiscordAPIError) => err);
  if (!webhook) return;
  if (webhook instanceof DiscordAPIError) {
    if (webhook.status === 404) {
      await mongo
        .collection("settings")
        .updateOne(
          { guild: messages.first()?.guild?.id },
          { $unset: { deleteLogChannel: "", deleteLogChannelWebhook: "" } }
        )
        .catch(Logger);
    }
    return;
  }
  await webhook.send({ files: [filePath] }).catch(console.error);
  await unlink(filePath).catch(Logger);
};
