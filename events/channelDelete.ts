import {
  DMChannel,
  EmbedBuilder,
  NonThreadGuildBasedChannel,
} from "discord.js";
import db from "../mongo";
import Logger from "../logger";
import SendLog from "../send_log";

const mongo = db.db("bot");

module.exports = async function (
  channel: DMChannel | NonThreadGuildBasedChannel,
) {
  if (channel instanceof DMChannel) return;
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: { $in: [channel.id, channel.parent?.id] },
      log: { $in: ["channel_delete", null] },
    })
    .catch(Logger);
  if (ignoreData) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: channel.guild.id })
    .catch(Logger);
  if (!settings?.channelDeleteLogChannelWebhook) return;
  const embed = new EmbedBuilder().setDescription(
    `${channel} has been deleted.`,
  );
  if (settings.embedColor) embed.setColor(settings.embedColor);
  await SendLog(
    settings.channelDeleteLogChannelWebhook,
    embed,
    channel.guild,
    "channelDeleteLogChannelWebhook",
  );
};
