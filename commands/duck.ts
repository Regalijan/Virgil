import { CommandInteraction, MessageEmbed } from "discord.js";
import axios from "axios";

export = {
  name: "duck",
  permissions: [],
  interactionData: {
    name: "duck",
    name_localizations: {
      "es-ES": "pato",
      "sv-SE": "duck",
    },
    description: "Quack",
    description_localizations: {
      "es-ES": "Graznido",
      "sv-SE": "Snatter",
    },
  },
  async exec(i: CommandInteraction): Promise<void> {
    const embed = new MessageEmbed({
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
