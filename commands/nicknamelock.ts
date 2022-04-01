import { CommandInteraction } from "discord.js";
import mongo from "../mongo";

const settingsStore = mongo.db("bot").collection("settings");

export = {
  name: "nicknamelock",
  permissions: ["MANAGE_GUIILD"],
  privileged: true,
  async exec(i: CommandInteraction): Promise<void> {
    switch (i.options.getBoolean("should_nickname", true)) {
      case true:
        await settingsStore.updateOne(
          { guild: i.guildId },
          { $set: { lockNicknames: true } }
        );
        return await i.reply({
          content: "Nicknames will now be enforced on this server.",
        });

      case false:
        await settingsStore.updateOne(
          { guild: i.guildId },
          { $unset: { lockNicknames: null } }
        );
        return await i.reply({
          content: "Nicknames will no longer be enforced on this server.",
        });
    }
  },
};
