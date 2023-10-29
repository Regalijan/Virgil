import { EmbedBuilder, GuildMember, PartialGuildMember } from "discord.js";
import db from "../mongo";
import Logger from "../logger";
import SendLog from "../send_log";

const mongo = db.db("bot");

module.exports = async function (
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember | PartialGuildMember,
) {
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newMember.guild.id })
    .catch(Logger);
  if (!settings) return;
  const embed = new EmbedBuilder();
  embed.setAuthor({
    name: newMember.user.username,
    iconURL: newMember.user.displayAvatarURL(),
  });
  if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
    if (!settings.roleLogChannelWebhook) return;
    embed.setTitle("Roles Updated");
    let oldrolesstring = "";
    oldMember.roles.cache.forEach((r) => {
      oldrolesstring += ` <@&${r.id}>`;
    });
    embed.addFields({ name: "Old Roles", value: oldrolesstring });
    if (oldMember.roles.cache.size > newMember.roles.cache.size) {
      let rolesremoved = "";
      oldMember.roles.cache.each((r) => {
        if (!newMember.roles.cache.has(r.id)) rolesremoved += ` <@&${r.id}>`;
      });
      embed.addFields({ name: "Roles Removed", value: rolesremoved });
    } else {
      let rolesadded = "";
      newMember.roles.cache.each((r) => {
        if (!oldMember.roles.cache.has(r.id)) rolesadded += ` <@&${r.id}>`;
      });
      embed.addFields({ name: "Roles Added", value: rolesadded });
    }
    await SendLog(
      settings.roleLogChannelWebhook,
      embed,
      newMember.guild,
      "roleLogChannelWebhook",
    );
  } else if (oldMember.nickname !== newMember.nickname) {
    if (!settings.nicknameLogChannelWebhook) return;
    embed.setTitle("Nickname Updated");
    embed.setDescription(
      `\`${oldMember.nickname ?? "None"}\` -> \`${
        newMember.nickname ?? "None"
      }\``,
    );
    await newMember.fetch().catch(console.error);
    embed.setColor(newMember.displayColor);
    await SendLog(
      settings.nicknameLogChannelWebhook,
      embed,
      newMember.guild,
      "nicknameLogChannelWebhook",
    );
  }
};
