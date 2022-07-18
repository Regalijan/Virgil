import { EmbedBuilder, GuildBan } from "discord.js";
import Sentry from "../sentry";
import db from "../mongo";
import SendLog from "../send_log";

const mongo = db.db("bot");

module.exports = async function (ban: GuildBan) {
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: ban.guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.banLogChannelWebhook) return;
  const embed = new EmbedBuilder()
    .setTitle("Member Banned")
    .setAuthor({
      name: ban.user.tag,
      iconURL: ban.user.displayAvatarURL(),
    })
    .setDescription(`<@${ban.user.id}> ${ban.user.tag}`)
    .addFields({ name: "Reason", value: ban.reason ?? "No reason provided" });

  await SendLog(
    settings.banLogChannelWebhook,
    embed,
    ban.guild,
    "banLogChannelWebhook"
  );
};
