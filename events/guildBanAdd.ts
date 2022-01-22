import { GuildBan, MessageEmbed } from "discord.js";
import Sentry from "../sentry";
import db from "../mongo";

const mongo = db.db("bot");

module.exports = async function (ban: GuildBan) {
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: ban.guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.banLogChannel) return;
  const banChannel = await ban.guild.channels
    .fetch(settings.banLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });

  if (banChannel?.type !== "GUILD_TEXT") return;
  if (
    !ban.guild.me ||
    !banChannel.permissionsFor(ban.guild.me).has("SEND_MESSAGES")
  )
    return;

  const embed = new MessageEmbed()
    .setTitle("Member Banned")
    .setAuthor({
      name: ban.user.tag,
      iconURL: ban.user.displayAvatarURL({ dynamic: true }),
    })
    .setDescription(`<@${ban.user.id}> ${ban.user.tag}`)
    .addField("Reason", ban.reason ?? "No reason provided");

  if (ban.guild.me?.permissions.has("VIEW_AUDIT_LOG")) {
    const auditEntry = (
      await ban.guild.fetchAuditLogs({ type: 22, limit: 1 }).catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      })
    )?.entries.first();
    if (auditEntry?.executor?.id === ban.guild.me.id) return;
    embed.setAuthor({
      name: auditEntry?.executor?.tag ?? "Unknown",
    });
  }
  await banChannel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
};
