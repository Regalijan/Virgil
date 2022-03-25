import { CommandInteraction } from "discord.js";
import axios from "axios";

export = {
  name: "fact",
  permissions: [],
  interactionData: {
    name: "fact",
    name_localizations: {
      "es-ES": "hecho",
      "sv-SE": "fakta",
    },
    description: "Gets a fact",
    description_localizations: {
      "es-ES": "Obtiene un hecho",
      "sv-SE": "Hämta en fakta",
    },
  },
  async exec(i: CommandInteraction): Promise<void> {
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
