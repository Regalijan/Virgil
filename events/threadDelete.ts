import { EmbedBuilder, ThreadChannel } from "discord.js";
import db from "../mongo";
import Logger from "../logger";
import SendLog from "../send_log";

const mongo = db.db("bot");

module.exports = async function (thread: ThreadChannel) {
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: { $in: [thread.parent?.id, thread.parent?.parent?.id] },
      log: { $in: ["thread_delete", null] },
    })
    .catch(Logger);
  if (ignoreData) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: thread.guildId })
    .catch(Logger);
  if (!settings?.threadDeleteLogChannelWebhook) return;
  const embed = new EmbedBuilder()
    .setDescription(`Thread ${thread.name} deleted.`)
    .setFooter({ text: `Thread ${thread.id}` })
    .setColor([255, 0, 0]);
  await SendLog(
    settings.threadDeleteLogChannelWebhook,
    embed,
    thread.guild,
    "threadDeleteLogChannelWebhook",
  );
};
