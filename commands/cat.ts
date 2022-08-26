import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import axios from "axios";

export = {
  name: "cat",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const cat = await axios("https://nekos.life/api/v2/img/meow").catch((e) =>
      console.error(e)
    );
    if (!cat) {
      await i.reply({
        content:
          "The server decided no cat pic for you - please try again later.",
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Meow :cat:")
      .setImage(cat.data.url)
      .setAuthor({
        name: i.user.tag,
        iconURL: i.user.displayAvatarURL(),
      });
    const member = await i.guild?.members
      .fetch(i.user.id)
      .catch((e: unknown) => console.error(e));
    if (member) embed.setColor(member.displayColor);
    await i.reply({ embeds: [embed] });
  },
};
