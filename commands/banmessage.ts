import { CommandInteraction } from "discord.js";
import mongo from "../mongo";
const settingsStore = mongo.db("bot").collection("settings");

export = {
  name: "banmessage",
  permissions: ["MANAGE_GUILD"],
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
