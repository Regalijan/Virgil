import { EmbedBuilder, NonThreadGuildBasedChannel } from "discord.js";
import Logger from "../logger";
import sendLog from "../send_log";
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
  const logChannel = await mongo
    .collection("log_channels")
    .findOne({ guild: channel.guildId, type: "channel_create" });
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: channel.guild.id })
    .catch(Logger);
  if (!logChannel) return;
  const embed = new EmbedBuilder().setDescription(
    `${channel} has been created.`,
  );

  await sendLog(logChannel.webhook, embed, channel.guild, "create_channel");
};
