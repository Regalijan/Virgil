import {
  DMChannel,
  EmbedBuilder,
  NonThreadGuildBasedChannel,
} from "discord.js";
import db from "../mongo";
import logger from "../logger";
import sendLog from "../send_log";

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
    .catch(logger);
  if (ignoreData) return;

  const logChannel = await mongo
    .collection("log_channels")
    .findOne(
      { guild: channel.guildId, type: "channel_delete" },
      { projection: { webhook: 1 } },
    );

  if (!logChannel) return;
  const embed = new EmbedBuilder().setDescription(
    `${channel} has been deleted.`,
  );

  await sendLog(logChannel.webhook, embed, channel.guild, "channel_delete");
};
