import { CommandInteraction, MessageEmbed } from "discord.js";
import axios from "axios";

export = {
  name: "cat",
  permissions: [],
  interactionData: {
    name: "cat",
    name_localizations: {
      "es-ES": "gato",
      "sv-SE": "katt",
    },
    description: "Gets picture of cat",
    description_localizations: {
      "es-ES": "Obtiene una imagen de un gato",
      "sv-SE": "Hämtar en bild av en katt",
    },
  },
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
