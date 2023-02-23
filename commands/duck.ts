import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import axios from "axios";

export = {
  name: "duck",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder({
      title: ":duck: QUACK!",
    });
    const member = await i.guild?.members
      .fetch(i.user.id)
      .catch((e) => console.error(e));
    if (member) embed.setColor(member.displayColor);
    const ducky = await axios("https://random-d.uk/api/v2/random");
    embed.setImage(ducky.data.url);
    embed.setFooter(ducky.data.message);
    await i.reply({ embeds: [embed] });
  },
};
