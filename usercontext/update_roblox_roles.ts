import { UserContextMenuCommandInteraction } from "discord.js";
import Common from "../common";

export = {
  name: "Update Roblox Roles",
  async exec(i: UserContextMenuCommandInteraction): Promise<void> {
    if (!i.member) {
      await i.reply({
        content: "This user is not in the server!",
        ephemeral: true,
      });
      return;
    }

    const member = await i.guild?.members.fetch(i.targetId);
    if (!member) {
      await i.reply({
        content:
          "`Error: <ContextMenuInteraction>.guild is null or member does not exist.`",
        ephemeral: true,
      });
      return;
    }

    await i.deferReply({ ephemeral: true });
    await i.followUp({
      content: (await Common.verify(member, i.targetId === i.user.id)).content,
    });
  },
};
