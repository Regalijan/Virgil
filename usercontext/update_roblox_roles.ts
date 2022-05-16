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
    const member = await i.guild?.members.fetch(i.targetId);
    if (!member)
      return await i.reply({
        content:
          "`Error: <ContextMenuInteraction>.guild is null or member does not exist.`",
        ephemeral: true,
      });
    await i.reply({
      content: await Common.verify(member, i.targetId === i.user.id),
      ephemeral: true,
    });
  },
};
