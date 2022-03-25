import { CommandInteraction, MessageEmbed } from "discord.js";

export = {
  name: "whois",
  permissions: [],
  interactionData: {
    name: "whois",
    name_localizations: {
      "es-ES": "quién_es",
      "sv-SE": "vem_är",
    },
    description: "Get user information",
    description_localizations: {
      "es-ES": "Obtén información de un usuario",
      "sv-SE": "Hämta användarinformation",
    },
    options: [
      {
        type: 6,
        name: "user",
        name_localizations: {
          "es-ES": "usuario",
          "sv-SE": "användare",
        },
        description: "User to look up",
        description_localizations: {
          "es-ES": "Usuario a buscar",
          "sv-SE": "Användare att hämta",
        },
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const user = i.options.getUser("user") ?? i.user;
    const embed = new MessageEmbed({ title: "User Information" })
      .setDescription("Profile of " + user.tag)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "User ID", value: user.id },
        { name: "Joined Discord at", value: user.createdAt.toString() }
      );
    if (i.inGuild()) {
      const member = await i.guild?.members.fetch(user.id);
      embed.setColor(member?.displayColor ?? 0);
      embed.addFields(
        { name: "Highest Role", value: `<@&${member?.roles.highest.id}>` },
        { name: "Joined server at", value: `${member?.joinedAt}` }
      );
    }
    await i.reply({ embeds: [embed] });
  },
};
