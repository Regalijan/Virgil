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
  _oldChannel: DMChannel | NonThreadGuildBasedChannel,
  newChannel: DMChannel | NonThreadGuildBasedChannel,
) {
  if (newChannel instanceof DMChannel) return;
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: { $in: [newChannel.id, newChannel.parent?.id] },
      log: { $in: ["channel_update", null] },
    })
    .catch(Logger);
  if (ignoreData) return;

  const logChannel = await mongo
    .collection("log_channels")
    .findOne(
      { guild: newChannel.guild.id, type: "channel_update" },
      { projection: { webhook: 1 } },
    );

  if (!logChannel) return;
  const embed = new EmbedBuilder().setDescription(
    `${newChannel} has been updated. See audit logs for details.`,
  );

  await SendLog(logChannel.webhook, embed, newChannel.guild, "channel_update");
};
