import { EmbedBuilder, GuildMember, PartialGuildMember } from "discord.js";
import db from "../mongo";
import SendLog from "../send_log";
import { type AnyBulkWriteOperation } from "mongodb";

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

      const additions: AnyBulkWriteOperation[] = [];

      addedStickyRoles.forEach((role) => {
        additions.push({
          updateOne: {
            filter: {
              guild: newMember.guild.id,
              role,
              user: newMember.id,
            },
            update: {
              $setOnInsert: {
                guild: newMember.guild.id,
                role,
                user: newMember.id,
              },
            },
            upsert: true,
          },
        });
      });

      await appliedStickyRolesCol.bulkWrite(additions);
    } else {
      const removedStickyRoles = oldRoles.filter(
        (role) =>
          !newRoles.includes(role) &&
          stickyRoles.find((sr) => sr.role === role),
      );

      await appliedStickyRolesCol.deleteMany({
        guild: newMember.guild.id,
        role: { $in: removedStickyRoles },
        user: newMember.id,
      });
    }
  }

  const channelStore = mongo.collection("log_channels");
  const embed = new EmbedBuilder();
  embed.setAuthor({
    name: newMember.user.username,
    iconURL: newMember.user.displayAvatarURL(),
  });

  if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
    const logChannel = await channelStore.findOne(
      { guild: newMember.guild.id, type: "role" },
      { projection: { webhook: 1 } },
    );

    if (!logChannel) return;
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
    await SendLog(logChannel.webhook, embed, newMember.guild, "role");
  } else if (oldMember.nickname !== newMember.nickname) {
    const logChannel = await channelStore.findOne(
      { guild: newMember.guild.id, type: "nickname" },
      { projection: { webhook: 1 } },
    );

    if (!logChannel) return;
    embed.setTitle("Nickname Updated");
    embed.setDescription(
      `\`${oldMember.nickname ?? "None"}\` -> \`${
        newMember.nickname ?? "None"
      }\``,
    );
    await newMember.fetch().catch(console.error);
    embed.setColor(newMember.displayColor);
    await SendLog(logChannel.webhook, embed, newMember.guild, "nickname");
  }
};
