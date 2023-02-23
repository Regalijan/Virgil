import {
  DMChannel,
  EmbedBuilder,
  NonThreadGuildBasedChannel,
} from "discord.js";
import db from "../mongo";
import SendLog from "../send_log";
import Sentry from "../sentry";

const mongo = db.db("bot");

module.exports = async function (
  channel: DMChannel | NonThreadGuildBasedChannel
) {
  if (channel instanceof DMChannel) return;
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: { $in: [channel.id, channel.parent?.id] },
      log: { $in: ["channel_delete", null] },
    })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (ignoreData) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: channel.guild.id })
    .catch((e) => console.error(e));
  if (!settings?.channelDeleteLogChannelWebhook) return;
  const embed = new EmbedBuilder().setDescription(
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
