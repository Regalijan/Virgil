import { ContextMenuInteraction } from "discord.js";
import Common from "../common";

export = {
  name: "Update Roblox Roles",
  async exec(i: ContextMenuInteraction): Promise<void> {
    if (i.targetType !== "USER")
      return await i.reply({
        content: "User context expected but given message.",
        ephemeral: true,
      });
    if (!i.member)
      return await i.reply({
        content: "This user is not in the server!",
        ephemeral: true,
      });
    const member = await i.guild?.members.fetch(i.targetId);
    if (!member)
      return await i.reply({
        content:
          "`Error: <ContextMenuInteraction>.guild is null or member does not exist.`",
        ephemeral: true,
      });
    await i.deferReply({ ephemeral: true });
    await i.followUp({
      content: await Common.verify(member, i.targetId === i.user.id),
    });
  },
};
