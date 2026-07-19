import { EmbedBuilder, GuildMember } from "discord.js";
import mongo from "../mongo.js";
import SendLog from "../send_log.js";

const channelStore = mongo.db("bot").collection("log_channels");

module.exports = async function (member: GuildMember) {
  const logChannel = await channelStore.findOne(
    { guild: member.guild.id, type: "member_leave" },
    { projection: { webhook: 1 } },
  );

  if (!logChannel) return;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Member Left",
      iconURL: member.user.displayAvatarURL(),
    })
    .setColor(16711680)
    .setThumbnail(member.user.displayAvatarURL())
    .setDescription(`<@${member.id}> ${member.user.username}`)
    .setFooter({ text: `ID: ${member.id}` });
  await SendLog(logChannel.webhook, embed, member.guild, "member_leave");
};
