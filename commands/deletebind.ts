import { CommandInteraction } from "discord.js";
import mongo from "../mongo";

const bindDb = mongo.db("bot").collection("binds");

export = {
  name: "deletebind",
  description: "Deletes a bind",
  interactionData: {
    name: "deletebind",
    description: "Deletes a bind",
    options: [
      {
        type: 3,
        name: "id",
        description: "ID of the bind to delete",
        required: true,
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const bind = await bindDb.findOneAndDelete({
      id: i.options.getString("id", true),
    });
    await i.reply({
      content: bind.value ? "Bind deleted!" : "Bind does not exist!",
      ephemeral: !Boolean(bind.value),
    });
  },
};
