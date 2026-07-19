import { EmbedBuilder, NonThreadGuildBasedChannel } from "discord.js";
import Logger from "../logger.js";
import sendLog from "../send_log.js";
import db from "../mongo.js";

const mongo = db.db("bot");

export default async function (channel: NonThreadGuildBasedChannel) {
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: { $in: [channel.id, channel.parent?.id] },
      log: { $in: ["channel_create", null] },
    })
    .catch(Logger);
  if (ignoreData) return;

  const logChannel = await mongo
    .collection("log_channels")
    .findOne({ guild: channel.guildId, type: "channel_create" });

  if (!logChannel) return;
  const embed = new EmbedBuilder().setDescription(
    `${channel} has been created.`,
  );

  await sendLog(logChannel.webhook, embed, channel.guild, "create_channel");
}
