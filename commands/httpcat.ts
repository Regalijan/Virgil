import { CommandInteraction, MessageEmbed } from "discord.js";

export = {
  name: "httpcat",
  permissions: [],
  interactionData: {
    name: "http_cat",
    name_localizations: {
      "en-US": "HTTP cat",
      "es-ES": "Gato HTTP",
      "sv-SE": "HTTP-katt",
    },
    description: "Get an HTTP cat",
    description_localizations: {
      "es-ES": "Obtén un gato HTTP",
      "sv-SE": "Hämta en HTTP-katt",
    },
    options: [
      {
        type: 4,
        name: "status",
        name_localizations: {
          "es-ES": "Estado",
          "sv-SE": "Status",
        },
        description: "HTTP status",
        description_localizations: {
          "es-ES": "Estado HTTP",
          "sv-SE": "HTTP-status",
        },
        required: true,
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle(":cat: Meow!")
      .setImage(`https://http.cat/${i.options.getInteger("status")}`);

    const member = await i.guild?.members
      .fetch(i.user.id)
      .catch((e) => console.error(e));
    if (member && member.displayColor) embed.setColor(member.displayColor);
    await i.reply({ embeds: [embed] });
  },
};
