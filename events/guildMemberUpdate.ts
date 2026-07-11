import { EmbedBuilder, GuildMember, PartialGuildMember } from "discord.js";
import db from "../mongo";
import Logger from "../logger";
import SendLog from "../send_log";
import { type ObjectId } from "mongodb";

const mongo = db.db("bot");

module.exports = async function (
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember | PartialGuildMember,
) {
  const stickyRoles = await mongo
    .collection("sticky_roles")
    .find({ guild: newMember.guild.id })
    .toArray();

  if (
    oldMember.roles.cache.size !== newMember.roles.cache.size &&
    stickyRoles.length
  ) {
    const oldRoles = oldMember.roles.cache.keys().toArray();
    const newRoles = newMember.roles.cache.keys().toArray();
    const wasRoleApplied = newRoles.length > oldRoles.length;
    const appliedStickyRolesCol = mongo.collection("applied_sticky_roles");

    if (wasRoleApplied) {
      const addedStickyRoles = newRoles.filter(
        (role) =>
          !oldRoles.includes(role) &&
          stickyRoles.find((sr) => sr.role === role),
      );

      const additions: { guild: string; role: string; user: string }[] = [];

      addedStickyRoles.forEach((role) => {
        additions.push({
          guild: newMember.guild.id,
          role,
          user: newMember.user.id,
        });
      });

      await appliedStickyRolesCol.updateMany(
        {
          guild: newMember.guild.id,
          role: { $in: [addedStickyRoles] },
          user: newMember.id,
        },
        { $setOnInsert: [additions] },
        { upsert: true },
      );
    } else {
      const removedStickyRoles = oldRoles.filter(
        (role) =>
          !newRoles.includes(role) &&
          stickyRoles.find((sr) => sr.role === role),
      );

      const removals: ObjectId[] = stickyRoles
        .filter((sr) => removedStickyRoles.includes(sr.role))
        .map((s) => s._id);

      if (removals.length)
        await appliedStickyRolesCol.deleteMany({ _id: { $in: removals } });
    }
  }

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
