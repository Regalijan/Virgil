import {
  DMChannel,
  MessageEmbed,
  NonThreadGuildBasedChannel,
} from "discord.js";
import db from "../mongo";

const mongo = db.db("bot");

module.exports = async function (
  channel: DMChannel | NonThreadGuildBasedChannel
) {
  if (channel.type === "DM") return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: channel.guild.id })
    .catch((e) => console.error(e));
  if (!settings?.channelDeleteLogChannel) return;
  const logChannel = await channel.guild.channels
    .fetch(settings.channelDeleteLogChannel)
    .catch((e) => console.error(e));
  if (
    !logChannel ||
    logChannel.type !== "GUILD_TEXT" ||
    !channel.guild.me ||
    !channel.permissionsFor(channel.guild.me.id)?.has("SEND_MESSAGES")
  )
    return;
  const embed = new MessageEmbed().setDescription(
    `${channel} has been deleted.`
  );
  if (settings.embedColor) embed.setColor(settings.embedColor);
  if (channel.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
    const auditlogs = await channel.guild
      .fetchAuditLogs({ limit: 1, type: 12 })
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
