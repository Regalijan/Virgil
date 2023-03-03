import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export = {
  name: "birb",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder({ title: "Tweet Tweet..." });
    const member = await i.guild?.members
      .fetch(i.user.id)
      .catch((e) => console.error(e));
    if (member?.displayColor) embed.setColor(member.displayColor);
    const birbRequest = await fetch("https://random.birb.pw/tweet.json");
    const birbData = await birbRequest.json();
    embed.setImage(`https://random.birb.pw/img/${birbData.file}`);
    await i.reply({ embeds: [embed] });
  },
};
