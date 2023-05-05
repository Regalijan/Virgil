import { EmbedBuilder, GuildBan } from "discord.js";
import db from "../mongo";
import Logger from "../logger";
import SendLog from "../send_log";

const mongo = db.db("bot");

module.exports = async function (ban: GuildBan) {
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: ban.guild.id })
    .catch(Logger);
  if (!settings?.banLogChannelWebhook) return;
  const embed = new EmbedBuilder()
    .setTitle("Member Banned")
    .setAuthor({
      name: ban.user.tag,
      iconURL: ban.user.displayAvatarURL(),
    })
    .setDescription(`<@${ban.user.id}> ${ban.user.username}`)
    .addFields({ name: "Reason", value: ban.reason ?? "No reason provided" });

  await SendLog(
    settings.banLogChannelWebhook,
    embed,
    ban.guild,
    "banLogChannelWebhook"
  );
};
