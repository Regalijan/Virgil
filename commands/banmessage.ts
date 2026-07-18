import { ChatInputCommandInteraction, MessageFlagsBitField } from "discord.js";
import mongo from "../mongo";
const messagesStore = mongo.db("bot").collection("ban_messages");

export = {
  name: "banmessage",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const settings = await messagesStore.findOne({ guild: i.guildId });
    if (!settings) {
      await i.reply({
        content:
          "Server settings are not initialized! Please run the initialize command.",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }
    switch (i.options.getSubcommand(true)) {
      case "set":
        await messagesStore.updateOne(
          { guild: i.guildId },
          {
            $set: { message_content: i.options.getString("message", true) },
            $setOnInsert: { guild: i.guildId },
          },
          { upsert: true },
        );
        await i.reply({
          content: "Ban message set!",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        break;

      case "clear":
        await messagesStore.updateOne(
          { guild: i.guildId },
          { $unset: { message_content: "" } },
        );
        await i.reply({
          content: "Ban message cleared!",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        break;
    }
  },
};
