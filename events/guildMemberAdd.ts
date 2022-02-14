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
  if (!settings?.memberJoinLogChannelWebhook) return;
  const embed = new MessageEmbed()
    .setAuthor({
      name: "Member Joined",
      iconURL: member.user.displayAvatarURL({ dynamic: true }),
    })
    .setColor(3756250)
    .setThumbnail(member.displayAvatarURL({ dynamic: true }))
    .setDescription(`<@${member.id}> ${member.user.tag}`)
    .addField(
      "Registration Date",
      new Intl.DateTimeFormat(member.guild.preferredLocale, {
        dateStyle: "medium",
        timeStyle: "medium",
      })
        .format(member.user.createdTimestamp)
        .toString()
    )
    .setFooter({ text: `ID: ${member.id}` });
  await SendLog(
    settings.memberJoinLogChannelWebhook,
    embed,
    member.guild,
    "memberJoinLogChannelWebhook"
  );
};
