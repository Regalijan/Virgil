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
  oldChannel: DMChannel | NonThreadGuildBasedChannel,
  newChannel: DMChannel | NonThreadGuildBasedChannel
) {
  if (newChannel instanceof DMChannel) return;
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: { $in: [newChannel.id, newChannel.parent?.id] },
      log: { $in: ["channel_update", null] },
    })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (ignoreData) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newChannel.guild.id })
    .catch((e) => console.error(e));
  if (!settings?.channelUpdateLogChannelWebhook) return;
  const embed = new EmbedBuilder().setDescription(
    `${newChannel} has been updated. See audit logs for details.`
  );
  if (settings.embedColor) embed.setColor(settings.embedColor);
  await SendLog(
    settings.channelUpdateLogChannelWebhook,
    embed,
    newChannel.guild,
    "channelUpdateLogChannelWebhook"
  );
};
