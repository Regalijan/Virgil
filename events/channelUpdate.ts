import {
  DMChannel,
  MessageEmbed,
  NonThreadGuildBasedChannel,
} from "discord.js";
import db from "../mongo";

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
  if (!settings?.channelUpdateLogChannel) return;
  const logChannel = await newChannel.guild.channels
    .fetch(settings.channelUpdateLogChannel)
    .catch((e) => console.error(e));
  if (
    !logChannel ||
    logChannel.type !== "GUILD_TEXT" ||
    !newChannel.guild.me ||
    !logChannel.permissionsFor(newChannel.guild.me).has("SEND_MESSAGES")
  )
    return;
  const embed = new MessageEmbed().setDescription(
    `${newChannel} has been updated. See audit logs for details.`
  );
  if (settings.embedColor) embed.setColor(settings.embedColor);
  if (newChannel.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
    const auditlogs = await newChannel.guild
      .fetchAuditLogs({ limit: 1, type: 11 })
      .catch((e) => console.error(e));
    if (auditlogs?.entries.size) {
      const auditEntry = auditlogs.entries.first();
      embed.setAuthor({
        name: `${auditEntry?.executor?.tag}`,
        iconURL: auditEntry?.executor?.displayAvatarURL({ dynamic: true }),
      });
    }
  }
  await logChannel.send({ embeds: [embed] }).catch((e) => console.error(e));
};
