import { EmbedBuilder, NonThreadGuildBasedChannel } from "discord.js";
import Logger from "../logger";
import SendLog from "../send_log";
import db from "../mongo";

const mongo = db.db("bot");

module.exports = async function (channel: NonThreadGuildBasedChannel) {
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: { $in: [channel.id, channel.parent?.id] },
      log: { $in: ["channel_create", null] },
    })
    .catch(Logger);
  if (ignoreData) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: channel.guild.id })
    .catch(Logger);
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
