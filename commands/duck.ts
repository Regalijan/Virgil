import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export = {
  name: "duck",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder({
      title: ":duck: QUACK!",
    });
    const member = await i.guild?.members
      .fetch(i.user.id)
      .catch((e) => console.error(e));
    if (member) embed.setColor(member.displayColor);
    const duckReq = await fetch("https://random-d.uk/api/v2/random").catch(
      () => {}
    );

    if (!duckReq?.ok) {
      await i.reply({
        content: "The duck pond is currently under maintenance.",
        ephemeral: true,
      });
      return;
    }

    const duckData = await duckReq.json();
    embed.setImage(duckData.url);
    embed.setFooter({ text: duckData.message });
    await i.reply({ embeds: [embed] });
  },
};
