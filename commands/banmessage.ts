import { ChatInputCommandInteraction } from "discord.js";
import mongo from "../mongo";
const settingsStore = mongo.db("bot").collection("settings");

export = {
  name: "banmessage",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const settings = await settingsStore.findOne({ guild: i.guildId });
    if (!settings) {
      await i.reply({
        content:
          "Server settings are not initialized! Please run the initialize command.",
        ephemeral: true,
      });
      return;
    }
    switch (i.options.getSubcommand(true)) {
      case "set":
        await settingsStore.updateOne(
          { guild: i.guildId },
          { $set: { banMessage: i.options.getString("message", true) } }
        );
        await i.reply({ content: "Ban message set!", ephemeral: true });
        break;

      case "clear":
        await settingsStore.updateOne(
          { guild: i.guildId },
          { $unset: { banMessage: "" } }
        );
        await i.reply({
          content: "Ban message cleared!",
          ephemeral: true,
        });
        break;
    }
  },
};
