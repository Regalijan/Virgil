import { MessageEmbed, ThreadChannel } from "discord.js";
import db from "../mongo";
import SendLog from "../send_log";
import Sentry from "../sentry";

const mongo = db.db("bot");

module.exports = async function (thread: ThreadChannel) {
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: thread.guildId })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.threadDeleteLogChannelWebhook) return;
  const embed = new MessageEmbed()
    .setDescription(`Thread ${thread.name} deleted.`)
    .setFooter({ text: `Thread ${thread.id}` })
    .setColor([255, 0, 0]);
  await SendLog(
    settings.threadDeleteLogChannelWebhook,
    embed,
    thread.guild,
    "threadDeleteLogChannelWebhook"
  );
};
