import { MessageEmbed, ThreadChannel } from "discord.js";
import db from "../mongo";
import SendLog from "../send_log";
import Sentry from "../sentry";

const mongo = db.db("bot");

module.exports = async function (thread: ThreadChannel) {
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: { $in: [thread.parent?.id, thread.parent?.parent?.id] },
      log: { $in: ["thread_create", null] },
    })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (ignoreData) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: thread.guildId })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.threadCreateLogChannelWebhook) return;
  const embed = new MessageEmbed()
    .setDescription(`Thread <#${thread.id}> created by <@${thread.ownerId}>`)
    .setFooter({ text: `Thread ${thread.id}` })
    .setColor([0, 255, 0]);
  await SendLog(
    settings.threadCreateLogChannelWebhook,
    embed,
    thread.guild,
    "threadCreateLogChannelWebhook"
  );
};
