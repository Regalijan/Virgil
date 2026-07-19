import { ChatInputCommandInteraction, MessageFlagsBitField } from "discord.js";
import { verify } from "../common";

export const name = "update";

export async function exec(i: ChatInputCommandInteraction): Promise<void> {
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

  const { content } = await verify(member, member.id === i.user.id, i);

  await i.followUp({ content });
}
