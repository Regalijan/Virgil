import { ChatInputCommandInteraction } from "discord.js";

export = {
  name: "fact",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const factReq = await fetch("https://nekos.life/api/v2/fact").catch((e) =>
      console.error(e)
    );
    if (!factReq?.ok) {
      await i.reply({
        content:
          "The server decided no knowledge for you - please try again later.",
      });
      return;
    }

    await i.reply({ content: (await factReq.json()).fact });
  },
};
