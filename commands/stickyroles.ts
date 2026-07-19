import mongo from "../mongo";
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlagsBitField,
} from "discord.js";

const stickyRolesCol = mongo.db("bot").collection("sticky_roles");

export const name = "stickyroles";

export async function exec(i: ChatInputCommandInteraction) {
  const command = i.options.getSubcommand(true);

  if (command === "list") {
    const stickyRolesList = await stickyRolesCol
      .find({ guild: i.guildId })
      .project({ _id: 0 })
      .toArray();

    if (!stickyRolesList.length) {
      await i.reply({
        content: "There are no sticky roles.",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setDescription(
        stickyRolesList
          .map((s) => {
            return `<@&${s.role}>`;
          })
          .join("\n"),
      )
      .setTitle("Sticky Roles List");

    await i.reply({ embeds: [embed] });
    return;
  }

  const role = i.options.getRole("role", true);
  const obj = { guild: i.guildId, role: role.id };
  const existingStickyRole = await stickyRolesCol.findOne(obj);

  switch (command) {
    case "create":
      if (existingStickyRole) {
        await i.reply({
          content: "This role is already sticky!",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        return;
      }

      await stickyRolesCol.insertOne(obj);
      await i.reply({
        content: "Sticky role added!",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;

    case "remove":
      if (!existingStickyRole) {
        await i.reply({
          content: "This role is not sticky.",
          ephemeral: true,
        });
        return;
      }

      await stickyRolesCol.deleteOne(obj);
      await mongo.db("bot").collection("applied_sticky_roles").deleteMany(obj);
      await i.reply({
        content: "Sticky role removed!",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;

    default:
      return;
  }
}
