import { CommandInteraction, MessageEmbed } from "discord.js";
import axios from "axios";

export = {
  name: "birb",
  async exec(i: CommandInteraction): Promise<void> {
    const embed = new MessageEmbed({ title: "Tweet Tweet..." });
    const member = await i.guild?.members
      .fetch(i.user.id)
      .catch((e) => console.error(e));
    if (member?.displayColor) embed.setColor(member.displayColor);
    const birbRequest = await axios("https://random.birb.pw/tweet.json");
    embed.setImage(`https://random.birb.pw/img/${birbRequest.data.file}`);
    await i.reply({ embeds: [embed] });
  },
};
