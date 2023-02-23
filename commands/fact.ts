import { ChatInputCommandInteraction } from "discord.js";
import axios from "axios";

export = {
  name: "fact",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const fact = await axios("https://nekos.life/api/v2/fact").catch((e) =>
      console.error(e)
    );
    if (!fact) {
      await i.reply({
        content:
          "The server decided no knowledge for you - please try again later.",
      });
      return;
    }

    await i.reply({ content: fact.data.fact });
  },
};
