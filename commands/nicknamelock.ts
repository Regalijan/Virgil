import { ChatInputCommandInteraction } from "discord.js";
import mongo from "../mongo";

const settingsStore = mongo.db("bot").collection("settings");

export = {
  name: "nicknamelock",
  privileged: true,
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    switch (i.options.getBoolean("should_nickname", true)) {
      case true:
        await settingsStore.updateOne(
          { guild: i.guildId },
          { $set: { lockNicknames: true } },
        );
        await i.reply({
          content: "Nicknames will now be enforced on this server.",
        });
        return;

      case false:
        await settingsStore.updateOne(
          { guild: i.guildId },
          { $unset: { lockNicknames: null } },
        );
        await i.reply({
          content: "Nicknames will no longer be enforced on this server.",
        });
        return;
    }
  },
};
