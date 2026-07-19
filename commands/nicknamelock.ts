import { ChatInputCommandInteraction } from "discord.js";
import mongo from "../mongo.js";

const settingsStore = mongo.db("bot").collection("nickname_settings");

export const name = "nicknamelock";
export const privileged = true;

export async function exec(i: ChatInputCommandInteraction): Promise<void> {
  switch (i.options.getBoolean("should_nickname", true)) {
    case true:
      await settingsStore.updateOne(
        { guild: i.guildId },
        {
          $set: { lock_nicknames: true },
          $setOnInsert: { guild: i.guildId },
        },
        { upsert: true },
      );
      await i.reply({
        content: "Nicknames will now be enforced on this server.",
      });
      return;

    case false:
      await settingsStore.updateOne(
        { guild: i.guildId },
        { $unset: { lock_nicknames: null } },
      );
      await i.reply({
        content: "Nicknames will no longer be enforced on this server.",
      });
      return;
  }
}
