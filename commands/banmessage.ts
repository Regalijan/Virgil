import { CommandInteraction } from "discord.js";
import mongo from "../mongo";
const settingsStore = mongo.db("bot").collection("settings");

export = {
  name: "banmessage",
  permissions: ["MANAGE_GUILD"],
  interactionData: {
    name: "banmessage",
    name_localizations: {
      "es-ES": "mensaje_de_ban",
      "sv-SE": "bannmeddelande",
    },
    description: "Modify message to send to banned users",
    description_localizations: {
      "es-ES": "Modifica el mensaje que se enviará a los usuarios baneados",
      "sv-SE": "Ändra meddelande som skickas till bannade användare",
    },
    options: [
      {
        type: 1,
        name: "set",
        name_localizations: {
          "es-ES": "establecer",
          "sv-SE": "ställ_in",
        },
        description: "Set message",
        description_localizations: {
          "es-ES": "Establecer mensaje",
          "sv-SE": "Ställ in meddelande",
        },
        options: [
          {
            type: 3,
            name: "message",
            name_localizations: {
              "es-ES": "mensaje",
              "sv-SE": "meddelande",
            },
            description: "Message to set",
            description_localizations: {
              "es-ES": "Mensaje a establecer",
              "sv-SE": "Meddelande att ställa in",
            },
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: "clear",
        name_localizations: {
          "es-ES": "limpiar",
          "sv-SE": "rensa",
        },
        description: "Clear message",
        description_localizations: {
          "es-ES": "Limpiar mensaje",
          "sv-SE": "Rensa meddelande",
        },
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const settings = await settingsStore.findOne({ guild: i.guildId });
    if (!settings)
      return await i.reply({
        content:
          "Server settings are not initialized! Please run the initialize command.",
        ephemeral: true,
      });
    switch (i.options.getSubcommand(true)) {
      case "set":
        await settingsStore.updateOne(
          { guild: i.guildId },
          { $set: { banMessage: i.options.getString("message", true) } }
        );
        return await i.reply({ content: "Ban message set!", ephemeral: true });

      case "clear":
        await settingsStore.updateOne(
          { guild: i.guildId },
          { $unset: { banMessage: "" } }
        );
        return await i.reply({
          content: "Ban message cleared!",
          ephemeral: true,
        });
    }
  },
};
