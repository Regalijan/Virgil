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
      log: { $in: ["thread_create", null] },
    })
    .catch(Logger);
  if (ignoreData) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: thread.guildId })
    .catch(Logger);
  if (!settings?.threadCreateLogChannelWebhook) return;
  const embed = new EmbedBuilder()
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
