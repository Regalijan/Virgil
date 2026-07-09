import {
  DiscordAPIError,
  EmbedBuilder,
  GuildMember,
  PermissionsBitField,
  Role,
} from "discord.js";
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

  const highestRole = member.guild.members.me?.roles.highest;

  if (
    member.guild.members.me?.permissions.has(
      PermissionsBitField.Flags.ManageRoles,
    ) ||
    !highestRole
  )
    return;

  const appliedStickyRoles = await mongo
    .db("bot")
    .collection("applied_sticky_roles")
    .find({ guild: member.guild.id, user: member.id })
    .toArray();
  const rolesToAdd = [];

  for (const role of appliedStickyRoles) {
    let apiRole: Role | null;

    try {
      apiRole = await member.guild.roles.fetch(role.role);

      if (
        !apiRole ||
        highestRole.comparePositionTo(apiRole) <= 0 ||
        member.roles.cache.has(apiRole.id)
      )
        continue;

      rolesToAdd.push(apiRole);
    } catch (e) {
      if (e instanceof DiscordAPIError && e.status === 404) {
        await mongo
          .db("bot")
          .collection("applied_sticky_roles")
          .deleteMany({ role: role.role });
        await mongo
          .db("bot")
          .collection("sticky_roles")
          .deleteOne({ role: role.role });
      }
    }
  }

  try {
    await member.roles.add(rolesToAdd);
  } catch (e) {
    console.error(
      `Failed to apply sticky roles to ${member.id} (${member.guild.id})`,
    );
  }
};
