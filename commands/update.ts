import { ChatInputCommandInteraction, MessageFlagsBitField } from "discord.js";
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
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    const { content } = await Common.verify(member, member.id === i.user.id, i);

    i.deferred ? await i.followUp({ content }) : await i.reply({ content });
  },
};
