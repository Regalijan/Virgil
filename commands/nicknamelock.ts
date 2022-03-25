import { CommandInteraction } from "discord.js";
import mongo from "../mongo";

const settingsStore = mongo.db("bot").collection("settings");

export = {
  name: "nicknamelock",
  permissions: ["MANAGE_GUIILD"],
  privileged: true,
  interactionData: {
    name: "nicknamelock",
    name_localizations: {
      "es-ES": "bloqueo_de_nombre",
      "sv-SE": "namnlock",
    },
    description:
      "Set whether or not users are renicknamed according to the set nickname format",
    description_localizations: {
      "es-ES":
        "Establece si los usuarios se renombran de acuerdo al formato de nombre",
      "sv-SE":
        "Ställ in om användare ska byta namn efter att namnsformatet har ställts in",
    },
    options: [
      {
        type: 5,
        name: "should_nickname",
        name_localizations: {
          "es-ES": "debe_renombrarse",
          "sv-SE": "skall_namn_bytas",
        },
        description:
          "Whether or not users should be nicknamed according to the set nickname format",
        description_localizations: {
          "es-ES":
            "¿Debe los usuarios renombrarse de acuerdo al formato de nombre?",
          "sv-SE":
            "Användare ska byta namn efter att namnsformatet har ställts in?",
        },
        required: true,
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    switch (i.options.getBoolean("should_nickname", true)) {
      case true:
        await settingsStore.updateOne(
          { guild: i.guildId },
          { $set: { lockNicknames: true } }
        );
        return await i.reply({
          content: "Nicknames will now be enforced on this server.",
        });

      case false:
        await settingsStore.updateOne(
          { guild: i.guildId },
          { $unset: { lockNicknames: null } }
        );
        return await i.reply({
          content: "Nicknames will no longer be enforced on this server.",
        });
    }
  },
};
