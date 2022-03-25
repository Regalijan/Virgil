import { CommandInteraction, Team } from "discord.js";

export = {
  name: "bonk",
  permissions: [],
  interactionData: {
    name: "bonk",
    description: "Bonk someone",
    description_localizations: {
      "es-ES": "Bonk alguien",
      "sv-SE": "Bonk någon",
    },
    options: [
      {
        type: 6,
        name: "user",
        name_localizations: {
          "es-ES": "usuario",
          "sv-SE": "användare",
        },
        description: "User to bonk",
        description_localizations: {
          "es-ES": "Usuario a bonk",
          "sv-SE": "Användare att bonk",
        },
        required: true,
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const target = i.options.getUser("user", true);
    const owner = i.client.application?.owner;
    let msg:
      | string
      | {
          title: string;
          image: { url: string };
          description: string;
          color?: number;
        } = `${i.user} has bonked ${target}`;
    if (target.id === i.client.user?.id) msg = "You will **not** bonk me.";
    else if (target.id === i.user.id) msg = "You bonked yourself.";
    else if (
      (owner instanceof Team && owner.members.has(target.id)) ||
      owner?.id === target.id
    )
      msg = "I will not let you bonk my owner.";
    else
      msg = {
        title: "Bonk!",
        image: {
          url: "https://i.pinimg.com/originals/f7/30/3b/f7303b16c4d7902e88060de1ad3c9ed3.jpg",
        },
        description: msg,
      };
    const member = await i.guild?.members
      .fetch(i.user.id)
      .catch((e) => console.error(e));
    if (typeof msg === "string") {
      await i.reply({ content: msg });
      return;
    }
    if (member) msg.color = member.displayColor;
    await i.reply({ embeds: [msg] });
  },
};
