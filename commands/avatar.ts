import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export = {
  name: "avatar",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder({
      title: "Avatar",
    });
    if (i.options.getUser("user")) {
      const target = i.options.getUser("user", true);
      embed.setAuthor({
        name: target.tag,
        iconURL: target.displayAvatarURL(),
      });
      embed.setImage(target.displayAvatarURL());
      const targetMember = await i.guild?.members.fetch(target.id);
      if (targetMember?.displayColor) embed.setColor(targetMember.displayColor);
    } else {
      embed.setAuthor({
        name: i.user.tag,
        iconURL: i.user.displayAvatarURL(),
      });
      embed.setImage(i.user.displayAvatarURL());
      const selfMember = await i.guild?.members.fetch(i.user.id);
      if (selfMember?.displayColor) embed.setColor(selfMember.displayColor);
    }
    await i.reply({ embeds: [embed] });
  },
};
