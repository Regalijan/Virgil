import { CommandInteraction } from "discord.js";
import mongo from "../mongo";
const settingsStore = mongo.db("bot").collection("settings");

export = {
  name: "muterole",
  permissions: ["MANAGE_GUILD"],
  interactionData: {
    name: "muterole",
    name_localizations: {
      "es-ES": "rol_de_muteo",
      "sv-SE": "mute_roll",
    },
    description: "Set or unset a role to use for mutes",
    description_localizations: {
      "es-ES": "Establece o desestablece un rol para usar para los mutes",
      "sv-SE":
        "Ställer in eller tar bort en roll för att använda för ljudborttagning",
    },
    options: [
      {
        type: 8,
        name: "role",
        name_localizations: {
          "es-ES": "rol",
          "sv-SE": "roll",
        },
        description:
          "Role to use (leave empty to reset - view with logs list command)",
        description_localizations: {
          "es-ES":
            "Rol a usar (dejar en blanco para resetear - ver con el comando listar logs)",
          "sv-SE":
            "Roll att använda (lämna tomt för att återställa - se med lista loggar-kommandot)",
        },
      },
    ],
  },
  privileged: true,

  async exec(i: CommandInteraction): Promise<void> {
    const currentSettings = await settingsStore.findOne({ guild: i.guildId });
    if (!currentSettings)
      return await i.reply({
        content:
          "Your server settings are not initialized! Please run `/initialize`",
        ephemeral: true,
      });
    const role = i.options.getRole("role");
    if (!role) {
      await settingsStore.updateOne(
        { guild: i.guildId },
        { $unset: { muteRole: "" } }
      );
      return await i.reply({ content: "Mute role unset!" });
    }
    if (
      !i.guild?.me ||
      i.guild.me.roles.highest.comparePositionTo(role.id) <= 0
    )
      return await i.reply({
        content:
          "This role cannot be used because it is higher than my highest role.",
        ephemeral: true,
      });
    await settingsStore.updateOne(
      { guild: i.guildId },
      { $set: { muteRole: role.id } }
    );
    await i.reply({ content: "Mute role set!" });
  },
};
