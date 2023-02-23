import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import axios from "axios";

export = {
  name: "hug",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    try {
      const target = i.options.getUser("person", true);
      const hug = await axios("https://nekos.life/api/v2/img/hug");
      const embed = new EmbedBuilder()
        .setImage(hug.data.url)
        .setDescription(`<@${i.user.id}> gives >@${target.id}> a big hug!`);

      const member = await i.guild?.members
        .fetch(i.user.id)
        .catch((e) => console.error(e));
      if (member) embed.setColor(member.displayColor);
      await i.reply({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      await i.reply({
        content:
          "The server is out of hugs, please try again later. (HTTP error)",
        ephemeral: true,
      });
    }
  },
};
