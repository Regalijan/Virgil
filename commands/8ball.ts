import { CommandInteraction, MessageEmbed } from "discord.js";
import axios from "axios";

export = {
  name: "8ball",
  permissions: [],
  interactionData: {
    name: "8ball",
    name_localizations: {
      "es-ES": "Bola-8",
      "sv-SE": "8-boll",
    },
    description: "What does the future hold?",
    description_localizations: {
      "es-ES": "¿Qué va a pasar en el futuro?",
      "sv-SE": "Vad kommer fram i framtiden?",
    },
    options: [
      {
        type: 3,
        name: "question",
        name_localizations: {
          "es-ES": "pregunta",
          "sv-SE": "fråga",
        },
        description: "What do you want to know?",
        description_localizations: {
          "es-ES": "¿Qué quieres saber?",
          "sv-SE": "Vad vill du veta?",
        },
        required: true,
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const eightballresponse = await axios(
      "https://nekos.life/api/v2/8ball"
    ).catch((e) => console.error(e));
    if (!eightballresponse) {
      await i.reply({
        content: `The 8-ball declined to give a response - please try again later.`,
      });
      return;
    }
    const embed = new MessageEmbed({
      author: {
        name: i.user.tag,
        icon_url: i.user.displayAvatarURL({ dynamic: true }),
      },
      description: eightballresponse.data.response,
      image: eightballresponse.data.url,
    });
    const member = await i.guild?.members.fetch(i.user.id);
    if (member?.displayColor) embed.setColor(member.displayColor);
    await i.reply({ embeds: [embed] });
  },
};
