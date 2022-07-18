import { ChatInputCommandInteraction } from "discord.js";
import mongo from "../mongo";

const bindDb = mongo.db("bot").collection("binds");

export = {
  name: "deletebind",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const bind = await bindDb.findOneAndDelete({
      id: i.options.getString("id", true),
      server: i.guildId,
    });
    await i.reply({
      content: bind.value ? "Bind deleted!" : "Bind does not exist!",
      ephemeral: !bind.value,
    });
  },
};
