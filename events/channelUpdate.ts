import {
  DMChannel,
  MessageEmbed,
  NonThreadGuildBasedChannel,
} from "discord.js";
import db from "../mongo";
import SendLog from "../send_log";

const mongo = db.db("bot");

module.exports = async function (
  oldChannel: DMChannel | NonThreadGuildBasedChannel,
  newChannel: DMChannel | NonThreadGuildBasedChannel
) {
  if (newChannel.type === "DM") return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newChannel.guild.id })
    .catch((e) => console.error(e));
  if (!settings?.channelUpdateLogChannelWebhook) return;
  const embed = new MessageEmbed().setDescription(
    `${newChannel} has been updated. See audit logs for details.`
  );
  if (settings.embedColor) embed.setColor(settings.embedColor);
  await SendLog(
    settings.channelUpdateLogChannelWebhook,
    embed,
    newChannel.guild.id,
    "channelUpdateLogChannelWebhook"
  );
};
