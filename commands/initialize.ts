import { CommandInteraction } from "discord.js";
import mongo from "../mongo";

export = {
  name: "initialize",
  permissions: ["MANAGE_GUILD"],
  interactionData: {
    name: "initialize",
    name_localizations: {
      "es-ES": "inicializar",
      "sv-SE": "initialisera",
    },
    description: "Initialize server settings",
    description_localizations: {
      "es-ES": "Inicializa los ajustes del servidor",
      "sv-SE": "Initialisera serverinställningar",
    },
  },
  async exec(i: CommandInteraction): Promise<void> {
    if (!i.guildId) {
      await i.reply({
        content:
          "Uh oh! Something happened during the pre-run check - but don't worry, nothing was modified!",
        ephemeral: true,
      });
      return;
    }

    const currentSettings = await mongo
      .db("bot")
      .collection("settings")
      .findOne({ guild: i.guildId })
      .catch((e) => console.error(e));

    if (typeof currentSettings === "undefined") {
      await i.reply({
        content:
          "Uh oh! Something happened during the pre-run check - but don't worry, nothing was modified!",
        ephemeral: true,
      });
      return;
    }

    if (currentSettings) {
      await i.reply({
        content: `Existing settings were found for this server! If you wish to start from scratch,${
          i.guild?.ownerId === i.user.id ? "" : " ask the server owner to "
        } run the \`/factoryreset\` command`,
        ephemeral: true,
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
        ephemeral: true,
      });
      return;
    }

    await i.reply({ content: "Settings initialized." });
  },
};
