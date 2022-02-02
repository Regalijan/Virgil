import {
  DMChannel,
  MessageEmbed,
  NonThreadGuildBasedChannel,
} from "discord.js";
import db from "../mongo";
import SendLog from "../send_log";

const mongo = db.db("bot");

module.exports = async function (
  channel: DMChannel | NonThreadGuildBasedChannel
) {
  if (channel.type === "DM") return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: channel.guild.id })
    .catch((e) => console.error(e));
  if (!settings?.channelDeleteLogChannelWebhook) return;
  const embed = new MessageEmbed().setDescription(
    `${channel} has been deleted.`
  );
  if (settings.embedColor) embed.setColor(settings.embedColor);
  await SendLog(
    settings.channelDeleteLogChannelWebhook,
    embed,
    channel.guild,
    "channelDeleteLogChannelWebhook"
  );
};
