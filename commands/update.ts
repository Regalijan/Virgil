import { CommandInteraction } from "discord.js";
import Common from "../common";

export = {
  name: "update",
  permissions: [], // This is to allow users to update themselves as there is a misconception that the command to verify is this one
  interactionData: {
    name: "update",
    description: "Updates a user's name and Roblox roles",
    options: [
      {
        type: 6,
        name: "user",
        description: "User to update",
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const member = await i.guild?.members
      .fetch(i.options.getUser("user") ?? i.user.id)
      .catch((e) => console.error(e));
    if (!member) throw Error("Interaction-provided GuildMember is undefined");
    if (member.id !== i.user.id) {
      const executorMember = await i.guild?.members
        .fetch(i.user.id)
        .catch((e) => console.error(e));
      if (!executorMember?.permissions.has("MANAGE_GUILD"))
        return await i.reply({
          content:
            "Oops! You do not have permission to use this command; if you want to verify yourself, please run `/verify`",
          ephemeral: true,
        });
    }
    await i.deferReply();
    await i.reply({
      content: await Common.verify(member, member.id === i.user.id),
    });
  },
};
