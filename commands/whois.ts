import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export = {
  name: "whois",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const user = i.options.getUser("user") ?? i.user;
    const embed = new EmbedBuilder({ title: "User Information" })
      .setDescription("Profile of " + user.tag)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "User ID", value: user.id },
        { name: "Joined Discord at", value: user.createdAt.toString() },
      );
    if (i.inGuild()) {
      const member = await i.guild?.members.fetch(user.id);
      embed.setColor(member?.displayColor ?? 0);
      embed.addFields(
        { name: "Highest Role", value: `<@&${member?.roles.highest.id}>` },
        { name: "Joined server at", value: `${member?.joinedAt}` },
      );
    }
    await i.reply({ embeds: [embed] });
  },
};
