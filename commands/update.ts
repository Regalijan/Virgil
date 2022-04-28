import { CommandInteraction } from "discord.js";
import Common from "../common";

export = {
  name: "update",
  async exec(i: CommandInteraction): Promise<void> {
    const member = await i.guild?.members
      .fetch(i.options.getUser("user") ?? i.user.id)
      .catch((e) => console.error(e));
    if (!member) throw Error("Interaction-provided GuildMember is undefined");
    await i.deferReply();
    await i.followUp({
      content: await Common.verify(member, member.id === i.user.id),
    });
  },
};
