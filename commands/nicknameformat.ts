import { CommandInteraction } from "discord.js";
import mongo from "../mongo";

const settingsDB = mongo.db("bot").collection("settings");

export = {
  name: "nicknameformat",
  permissions: ["MANAGE_GUILD"],
  interactionData: {
    name: "nicknameformat",
    name_localizations: {
      "en-US": "Nickname format",
      "es-ES": "Formato de apodo",
      "sv-SE": "Smeknamnformat",
    },
    description: "Set format of nicknames to",
    description_localizations: {
      "es-ES": "Establecer el formato de apodos a",
      "sv-SE": "Ställ in formatet på smeknamn till",
    },
    options: [
      {
        type: 3,
        name: "format",
        name_localizations: {
          "es-ES": "Formato",
          "sv-SE": "Format",
        },
        description:
          "The format to use when nicknaming a user - Default {{SMARTNAME}}",
        description_localizations: {
          "es-ES":
            "El formato a usar cuando se le apoda un usuario - Por defecto {{SMARTNAME}}",
          "sv-SE":
            "Formatet som ska användas när en användare nämnas - Standard {{SMARTNAME}}",
        },
        required: true,
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    await settingsDB.findOneAndUpdate(
      { server: i.guildId },
      { $set: { nicknameformat: i.options.get("format", true) } }
    );
    await i.reply({ content: "Nickname format updated!", ephemeral: true });
  },
};
