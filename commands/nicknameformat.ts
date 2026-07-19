import { ChatInputCommandInteraction, MessageFlagsBitField } from "discord.js";
import mongo from "../mongo";

const settingsDB = mongo.db("bot").collection("nickname_settings");

export const name = "nicknameformat";

export async function exec(i: ChatInputCommandInteraction): Promise<void> {
  await settingsDB.updateOne(
    { guild: i.guildId },
    {
      $set: { nickname_format: i.options.getString("format", true) },
      $setOnInsert: { guild: i.guildId },
    },
    { upsert: true },
  );
  await i.reply({
    content: "Nickname format updated!",
    flags: [MessageFlagsBitField.Flags.Ephemeral],
  });
}
