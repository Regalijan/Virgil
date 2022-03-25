import { CommandInteraction, MessageEmbed } from "discord.js";
import axios from "axios";

export = {
  name: "hug",
  permissions: [],
  interactionData: {
    name: "hug",
    name_localizations: {
      "es-ES": "abrazar",
      "sv-SE": "hugga",
    },
    description: "Hug someone",
    description_localizations: {
      "es-ES": "Abraza a alguien",
      "sv-SE": "Hugga någon",
    },
    options: [
      {
        type: 6,
        name: "person",
        name_localizations: {
          "es-ES": "persona",
          "sv-SE": "person",
        },
        description: "Person to hug",
        description_localizations: {
          "es-ES": "Persona a abrazar",
          "sv-SE": "Person att hugga",
        },
        required: true,
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    try {
      const target = i.options.getUser("person", true);
      const hug = await axios("https://nekos.life/api/v2/img/hug");
      const embed = new MessageEmbed()
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
