import { EmbedBuilder, GuildMember } from "discord.js";
import mongo from "../mongo";
import Logger from "../logger";
import SendLog from "../send_log";

const settingsDB = mongo.db("bot").collection("settings");

module.exports = async function (member: GuildMember) {
  const settings = await settingsDB
    .findOne({ guild: member.guild.id })
    .catch(Logger);
  if (!settings?.memberJoinLogChannelWebhook) return;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Member Joined",
      iconURL: member.user.displayAvatarURL(),
    })
    .setColor(3756250)
    .setThumbnail(member.displayAvatarURL())
    .setDescription(`<@${member.id}> ${member.user.username}`)
    .addFields({
      name: "Registration Date",
      value: new Intl.DateTimeFormat(member.guild.preferredLocale, {
        dateStyle: "medium",
        timeStyle: "medium",
      })
        .format(member.user.createdTimestamp)
        .toString(),
    })
    .setFooter({ text: `ID: ${member.id}` });
  await SendLog(
    settings.memberJoinLogChannelWebhook,
    embed,
    member.guild,
    "memberJoinLogChannelWebhook",
  );
};
