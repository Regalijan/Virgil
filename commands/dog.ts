import { CommandInteraction, MessageEmbed } from "discord.js";
import axios from "axios";

export = {
  name: "dog",
  async exec(i: CommandInteraction): Promise<void> {
    try {
      const dog = await axios("https://dog.ceo/api/breeds/image/random");
      const embed = new MessageEmbed()
        .setTitle(":dog: Woof!")
        .setImage(dog.data.message);

      const member = await i.guild?.members
        .fetch(i.user.id)
        .catch((e) => console.error(e));
      if (member) embed.setColor(member.displayColor);
      await i.reply({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      await i.reply({
        content:
          "The dog giver is on break, please try again later. (HTTP Error)",
        ephemeral: true,
      });
    }
  },
};
