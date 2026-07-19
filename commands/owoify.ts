import { ChatInputCommandInteraction } from "discord.js";

export const name = "owoify";

export async function exec(i: ChatInputCommandInteraction): Promise<void> {
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
}
