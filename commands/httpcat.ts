import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export = {
  name: "httpcat",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle(":cat: Meow!")
      .setImage(`https://http.cat/${i.options.getInteger("status")}`);

    const member = await i.guild?.members
      .fetch(i.user.id)
      .catch((e) => console.error(e));
    if (member && member.displayColor) embed.setColor(member.displayColor);
    await i.reply({ embeds: [embed] });
  },
};
