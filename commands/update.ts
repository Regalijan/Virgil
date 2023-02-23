import { ChatInputCommandInteraction } from "discord.js";
import Common from "../common";

export = {
  name: "update",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const member = await i.guild?.members
      .fetch(i.options.getUser("user") ?? i.user.id)
      .catch((e) => console.error(e));
    if (!member) {
      await i.reply({
        content: "This user is not in the server!",
        ephemeral: true,
      });
      return;
    }

    await i.deferReply();
    await i.followUp({
      content: await Common.verify(member, member.id === i.user.id),
    });
  },
};
