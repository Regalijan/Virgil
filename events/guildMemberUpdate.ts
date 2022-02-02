import { GuildMember, MessageEmbed, PartialGuildMember } from "discord.js";
import db from "../mongo";
import SendLog from "../send_log";
import Sentry from "../sentry";

const mongo = db.db("bot");

module.exports = async function (
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember | PartialGuildMember
) {
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newMember.guild.id })
    .catch((e) => console.error(e));
  if (!settings) return;
  const embed = new MessageEmbed();
  embed.setAuthor({
    name: newMember.user.tag,
    iconURL: newMember.user.displayAvatarURL({ dynamic: true }),
  });
  if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
    if (!settings.roleLogChannelWebhook) return;
    embed.setTitle("Roles Updated");
    let oldrolesstring = "";
    oldMember.roles.cache.forEach((r) => {
      oldrolesstring += ` <@&${r.id}>`;
    });
    embed.addField("Old Roles", oldrolesstring);
    if (oldMember.roles.cache.size > newMember.roles.cache.size) {
      let rolesremoved = "";
      oldMember.roles.cache.each((r) => {
        if (!newMember.roles.cache.has(r.id)) rolesremoved += ` <@&${r.id}>`;
      });
      embed.addField("Roles Removed", rolesremoved);
    } else {
      let rolesadded = "";
      newMember.roles.cache.each((r) => {
        if (!oldMember.roles.cache.has(r.id)) rolesadded += ` <@&${r.id}>`;
      });
      embed.addField("Roles Added", rolesadded);
    }
    await SendLog(
      settings.roleLogChannelWebhook,
      embed,
      newMember.guild,
      "roleLogChannelWebhook"
    );
  } else if (oldMember.nickname !== newMember.nickname) {
    if (!settings.nicknameLogChannelWebhook) return;
    embed.setTitle("Nickname Updated");
    embed.setDescription(
      `\`${oldMember.nickname ?? "None"}\` -> \`${
        newMember.nickname ?? "None"
      }\``
    );
    await newMember.fetch().catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
    embed.setColor(newMember.displayColor);
    await SendLog(
      settings.nicknameLogChannelWebhook,
      embed,
      newMember.guild,
      "nicknameLogChannelWebhook"
    );
  }
};
