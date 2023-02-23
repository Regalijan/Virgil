import { EmbedBuilder, NonThreadGuildBasedChannel } from "discord.js";
import SendLog from "../send_log";
import Sentry from "../sentry";
import db from "../mongo";

const mongo = db.db("bot");

module.exports = async function (channel: NonThreadGuildBasedChannel) {
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: { $in: [channel.id, channel.parent?.id] },
      log: { $in: ["channel_create", null] },
    })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (ignoreData) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: channel.guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.channelCreateLogChannelWebhook) return;
  const embed = new EmbedBuilder().setDescription(
    `${channel} has been created.`
  );
  if (settings.embedColor) embed.setColor(settings.embedColor);
  await SendLog(
    settings.channelCreateLogChannelWebhook,
    embed,
    channel.guild,
    "channelCreateLogChannelWebhook"
  );
};
