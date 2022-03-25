import { CommandInteraction } from "discord.js";
import mongo from "../mongo";

const bindDb = mongo.db("bot").collection("binds");

export = {
  name: "deletebind",
  description: "Deletes a bind",
  interactionData: {
    name: "deletebind",
    name_localizations: {
      "es-ES": "Eliminar un enlace",
      "sv-SE": "Ta bort en binda",
    },
    description: "Deletes a bind",
    description_localizations: {
      "es-ES": "Borra un bind",
      "sv-SE": "Tar bort en bind",
    },
    options: [
      {
        type: 3,
        name: "id",
        description: "ID of the bind to delete",
        description_localizations: {
          "es-ES": "ID del bind a borrar",
          "sv-SE": "ID på binden som ska tas bort",
        },
        required: true,
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const bind = await bindDb.findOneAndDelete({
      id: i.options.getString("id", true),
      server: i.guildId,
    });
    await i.reply({
      content: bind.value ? "Bind deleted!" : "Bind does not exist!",
      ephemeral: !Boolean(bind.value),
    });
  },
};
