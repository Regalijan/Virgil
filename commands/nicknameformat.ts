import { CommandInteraction } from "discord.js";
import mongo from "../mongo";

const settingsDB = mongo.db("bot").collection("settings");

export = {
  name: "nicknameformat",
  async exec(i: CommandInteraction): Promise<void> {
    await settingsDB.findOneAndUpdate(
      { server: i.guildId },
      { $set: { nicknameformat: i.options.get("format", true) } }
    );
    await i.reply({ content: "Nickname format updated!", ephemeral: true });
  },
};
