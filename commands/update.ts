import { CommandInteraction } from "discord.js";
import Common from "../common";

export = {
  name: "update",
  permissions: [], // This is to allow users to update themselves as there is a misconception that the command to verify is this one
  interactionData: {
    name: "update",
    name_localizations: {
      "es-ES": "Actualizar",
      "sv-SE": "Uppdatera",
    },
    description: "Updates a user's name and Roblox roles",
    description_localizations: {
      "es-ES": "Actualiza el nombre y los roles de un usuario",
      "sv-SE": "Uppdaterar en användares namn och Roblox roller",
    },
    options: [
      {
        type: 6,
        name: "user",
        name_localizations: {
          "es-ES": "Usuario",
          "sv-SE": "Användare",
        },
        description: "User to update",
        description_localizations: {
          "es-ES": "Usuario a actualizar",
          "sv-SE": "Användare att uppdatera",
        },
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
    await i.followUp({
      content: await Common.verify(member, member.id === i.user.id),
    });
  },
};
