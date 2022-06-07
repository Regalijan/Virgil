import { GuildMember, MessageEmbed } from "discord.js";
import mongo from "../mongo";
import Sentry from "../sentry";
import SendLog from "../send_log";

const settingsDB = mongo.db("bot").collection("settings");

module.exports = async function (member: GuildMember) {
  const settings = await settingsDB
    .findOne({ guild: member.guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.memberLeaveLogChannelWebhook) return;
  const embed = new MessageEmbed()
    .setAuthor({
      name: "Member Left",
      iconURL: member.user.displayAvatarURL({ dynamic: true }),
    })
    .setColor(16711680)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setDescription(`<@${member.id}> ${member.user.tag}`)
    .setFooter({ text: `ID: ${member.id}` });
  await SendLog(
    settings.memberLeaveLogChannelWebhook,
    embed,
    member.guild,
    "memberLeaveLogChannelWebhook"
  );
};
