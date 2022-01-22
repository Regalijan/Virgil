import { Collection, Message, PartialMessage, Snowflake } from "discord.js";
import db from "../mongo";
import Sentry from "../sentry";
import { join } from "path";
import { unlink, writeFile } from "fs/promises";

const mongo = db.db("bot");

module.exports = async function (
  messages: Collection<Snowflake, Message | PartialMessage>
) {
  if (!messages.first() || messages.first()?.channel.type === "DM") return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: messages.first()?.guild?.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.deleteLogChannel) return;
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
  try {
    await writeFile(filePath, fileBody);
  } catch (e) {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
    return;
  }
  const logChannel = await messages
    .first()
    ?.guild?.channels.fetch(settings.deleteLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (
    logChannel?.type !== "GUILD_TEXT" ||
    !logChannel.client.user ||
    !logChannel.permissionsFor(logChannel.client.user.id)?.has("SEND_MESSAGES")
  )
    return;
  await logChannel.send({ files: [filePath] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
  await unlink(filePath).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
};
