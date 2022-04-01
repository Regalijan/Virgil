import { CommandInteraction } from "discord.js";
import mongo from "../mongo";
const settingsStore = mongo.db("bot").collection("settings");

export = {
  name: "muterole",
  permissions: ["MANAGE_GUILD"],
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
