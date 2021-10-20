import { CommandInteraction } from "discord.js";

export = {
  name: "owoify",
  permissions: [],
  interactionData: {
    name: "owoify",
    description: "OwOify some text",
    options: [
      {
        type: 3,
        name: "text",
        description: "Text to OwOify",
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
