import { ChatInputCommandInteraction, MessageFlagsBitField } from "discord.js";
import mongo from "../mongo";

export = {
  name: "initialize",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const currentSettings = await mongo
      .db("bot")
      .collection("settings")
      .findOne({ guild: i.guildId })
      .catch((e) => console.error(e));

    if (typeof currentSettings === "undefined") {
      await i.reply({
        content:
          "Uh oh! Something happened during the pre-run check - but don't worry, nothing was modified!",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    if (currentSettings) {
      await i.reply({
        content: `Existing settings were found for this server! If you wish to start from scratch,${
          i.guild?.ownerId === i.user.id ? "" : " ask the server owner to "
        } run the \`/factoryreset\` command`,
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }
    try {
      await mongo
        .db("bot")
        .collection("settings")
        .insertOne({ guild: i.guildId });
    } catch (e) {
      console.error(e);
      await i.reply({
        content:
          "Uh oh! Something happened when trying to initialize! Please try again in a few minutes.",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    await i.reply({ content: "Settings initialized." });
  },
};
