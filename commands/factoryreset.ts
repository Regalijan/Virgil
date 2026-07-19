import { ChatInputCommandInteraction } from "discord.js";
import mongo from "../mongo.js";

export const name = "factoryreset";

export async function exec(i: ChatInputCommandInteraction): Promise<void> {
  await mongo.bulkWrite([
    {
      namespace: "bot.ban_messages",
      name: "deleteOne",
      filter: { guild: i.guildId },
    },
    {
      namespace: "bot.log_channels",
      name: "deleteMany",
      filter: { guild: i.guildId },
    },
    {
      namespace: "bot.nickname_settings",
      name: "deleteOne",
      filter: { guild: i.guildId },
    },
  ]);
  await i.reply({
    content: "Settings deleted! Leaving the server...",
    ephemeral: true,
  });

  await i.guild?.leave();
}
