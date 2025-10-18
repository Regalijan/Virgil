import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  MessageFlagsBitField,
  Role,
} from "discord.js";
import mongo from "../mongo";

export = {
  name: "bypasses",
  exec: async function (i: ChatInputCommandInteraction): Promise<void> {
    const bypassesDb = mongo.db("bot").collection("bind_bypasses");
    const subcommand = i.options.getSubcommand(true);

    if (subcommand === "list") {
      const bypassData = await bypassesDb.find({ guild: i.guildId }).toArray();
      const embed = new EmbedBuilder()
        .setDescription(
          bypassData
            .map((obj) => {
              return `<@${obj.type === "role" ? "&" : ""}${obj.id}>`;
            })
            .join("\n"),
        )
        .setTitle("Bypass list");

      await i.reply({ embeds: [embed] });
      return;
    }

    const target = i.options.getMentionable("target", true);

    if (subcommand == "remove" && Object.hasOwn(target, "id")) {
      // @ts-expect-error
      await bypassesDb.deleteOne({ guild: i.guildId, id: target.id });
      await i.reply({
        content: "Target removed from bypass list",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
    }

    if (!(target instanceof GuildMember) && !(target instanceof Role)) {
      await i.reply({
        content: "Failed to perform that action",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    const targetType = target instanceof GuildMember ? "user" : "role";

    switch (subcommand) {
      case "add":
        if (await bypassesDb.findOne({ guild: i.guildId, id: target.id })) {
          await i.reply({
            content: "There is already a bypass for this target",
            flags: [MessageFlagsBitField.Flags.Ephemeral],
          });
          return;
        }

        await bypassesDb.insertOne({
          guild: i.guildId,
          id: target.id,
          type: targetType,
        });

        await i.reply({
          content: "Target added to bypass list",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        return;

      case "remove":
        await bypassesDb.deleteOne({ guild: i.guildId, id: target.id });
        await i.reply({
          content: "Target removed from bypass list",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        return;

      default:
        await i.reply({
          content: "An impossible action was chosen, what did you do?",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        return;
    }
  },
};
