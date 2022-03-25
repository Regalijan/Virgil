import { CommandInteraction } from "discord.js";

export = {
  name: "owoify",
  permissions: [],
  interactionData: {
    name: "owoify",
    description: "OwOify some text",
    description_localizations: {
      "es-ES": "OwOify algo de texto",
      "sv-SE": "OwOify något text",
    },
    options: [
      {
        type: 3,
        name: "text",
        name_localizations: {
          "es-ES": "texto",
          "sv-SE": "text",
        },
        description: "Text to OwOify",
        description_localizations: {
          "es-ES": "Texto a OwOify",
          "sv-SE": "Text att OwOify",
        },
        required: true,
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const text = i.options
      .getString("text", true)
      .replace(/[lr]/g, "w")
      .replace(/[LR]/g, "W")
      .replace(/n([aeiou])/g, "ny$1")
      .replace(/n([AEIOU])/g, "nY$1")
      .replace(/N([aeiou])/g, "Ny$1")
      .replace(/N([AEIOU])/g, "NY$1")
      .replace(/ove/g, "uv");

    await i.reply({ content: text });
  },
};
