import { EmbedBuilder, GuildBan } from "discord.js";
import db from "../mongo";
import SendLog from "../send_log";

const mongo = db.db("bot");

module.exports = async function (ban: GuildBan) {
  const logChannel = await mongo
    .collection("log_channels")
    .findOne(
      { guild: ban.guild.id, type: "ban" },
      { projection: { webhook: 1 } },
    );

  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle("Member Banned")
    .setAuthor({
      name: ban.user.username,
      iconURL: ban.user.displayAvatarURL(),
    })
    .setDescription(`<@${ban.user.id}> ${ban.user.username}`)
    .addFields({ name: "Reason", value: ban.reason ?? "No reason provided" });

  await SendLog(logChannel.webhook, embed, ban.guild, "ban");
};
