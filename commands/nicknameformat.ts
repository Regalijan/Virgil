import { ChatInputCommandInteraction } from "discord.js";
import mongo from "../mongo";

const settingsDB = mongo.db("bot").collection("settings");

export = {
  name: "nicknameformat",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    await settingsDB.findOneAndUpdate(
      { server: i.guildId },
      { $set: { nicknameformat: i.options.getString("format", true) } },
    );
    await i.reply({ content: "Nickname format updated!", ephemeral: true });
  },
};
