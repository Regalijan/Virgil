import { CommandInteraction } from "discord.js";
import mongo from "../mongo";
const settingsStore = mongo.db("bot").collection("settings");

export = {
  name: "banmessage",
  permissions: ["MANAGE_GUILD"],
  interactionData: {
    name: "banmessage",
    description: "Modify message to send to banned users",
    options: [
      {
        type: 1,
        name: "set",
        description: "Set message",
        options: [
          {
            type: 3,
            name: "message",
            description: "Message to set",
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: "clear",
        description: "Clear message",
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
