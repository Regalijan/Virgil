import { CommandInteraction, MessageEmbed } from "discord.js";

export = {
  name: "avatar",
  permissions: [],
  interactionData: {
    name: "avatar",
    description: "Gets avatar of user",
    description_localizations: {
      "es-ES": "Obtiene el avatar de un usuario",
      "sv-SE": "Hämtar avatar för en användare",
    },
    options: [
      {
        type: 6,
        name: "user",
        name_localizations: {
          "es-ES": "Usuario",
          "sv-SE": "Användare",
        },
        description: "User to get avatar of",
        description_localizations: {
          "es-ES": "Usuario al que obtener el avatar",
          "sv-SE": "Användare för att hämta avatar",
        },
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const embed = new MessageEmbed({
      title: "Avatar",
    });
    if (i.options.getUser("user")) {
      const target = i.options.getUser("user", true);
      embed.setAuthor({
        name: target.tag,
        iconURL: target.displayAvatarURL({ dynamic: true }),
      });
      embed.setImage(target.displayAvatarURL({ dynamic: true }));
      const targetMember = await i.guild?.members.fetch(target.id);
      if (targetMember?.displayColor) embed.setColor(targetMember.displayColor);
    } else {
      embed.setAuthor(i.user.tag, i.user.displayAvatarURL({ dynamic: true }));
      embed.setImage(i.user.displayAvatarURL({ dynamic: true }));
      const selfMember = await i.guild?.members.fetch(i.user.id);
      if (selfMember?.displayColor) embed.setColor(selfMember.displayColor);
    }
    await i.reply({ embeds: [embed] });
  },
};
