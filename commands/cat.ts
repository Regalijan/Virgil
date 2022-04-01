import { CommandInteraction, MessageEmbed } from "discord.js";
import axios from "axios";

export = {
  name: "cat",
  permissions: [],
  async exec(i: CommandInteraction): Promise<void> {
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

    const embed = new MessageEmbed()
      .setTitle("Meow :cat:")
      .setImage(cat.data.url)
      .setAuthor({
        name: i.user.tag,
        iconURL: i.user.displayAvatarURL({ dynamic: true }),
      });
    const member = await i.guild?.members
      .fetch(i.user.id)
      .catch((e) => console.error(e));
    if (member) embed.setColor(member.displayColor);
    await i.reply({ embeds: [embed] });
  },
};
