import { MessageEmbed, NonThreadGuildBasedChannel } from "discord.js";
import Sentry from "../sentry";
import db from "../mongo";

const mongo = db.db("bot");

module.exports = async function (channel: NonThreadGuildBasedChannel) {
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: channel.guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.channelCreateLogChannel) return;
  const logChannel = await channel.guild.channels
    .fetch(settings.channelCreateLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (
    !logChannel ||
    logChannel.type !== "GUILD_TEXT" ||
    !channel.guild.me ||
    !channel.permissionsFor(channel.guild.me.id)?.has("SEND_MESSAGES")
  )
    return;
  const embed = new MessageEmbed().setDescription(
    `${channel} has been created.`
  );
  if (settings.embedColor) embed.setColor(settings.embedColor);
  if (channel.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
    const auditlogs = await channel.guild
      .fetchAuditLogs({ limit: 1, type: 10 })
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
    if (auditlogs?.entries.size) {
      const auditEntry = auditlogs.entries.first();
      embed.setAuthor({
        name: `${auditEntry?.executor?.tag}`,
        iconURL: auditEntry?.executor?.displayAvatarURL({ dynamic: true }),
      });
    }
  }
  await logChannel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
};
