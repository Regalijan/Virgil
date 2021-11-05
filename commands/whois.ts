import { CommandInteraction, MessageEmbed } from "discord.js";

export = {
  name: "whois",
  permissions: [],
  interactionData: {
    name: "whois",
    description: "Get user information",
    options: [
      {
        type: 6,
        name: "user",
        description: "User to look up",
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const user = i.options.getUser("user") ?? i.user;
    const embed = new MessageEmbed({ title: "User Information" })
      .setDescription("Profile of " + user.tag)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Username", value: i.id },
        { name: "User ID", value: user.id },
        { name: "Joined Discord at", value: user.createdAt.toString() }
      );
    if (i.inGuild()) {
      const member = await i.guild?.members.fetch(user.id);
      embed.addFields(
        { name: "Highest Role", value: `${member?.roles.highest.id}` },
        { name: "Joined server at", value: `${member?.joinedAt}` }
      );
    }
    await i.reply({ embeds: [embed] });
  },
};