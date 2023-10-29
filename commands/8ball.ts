import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export = {
  name: "8ball",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const eightballResponse = await fetch(
      "https://nekos.life/api/v2/8ball",
    ).catch((e) => console.error(e));
    if (!eightballResponse || !eightballResponse.ok) {
      await i.reply({
        content: `The 8-ball declined to give a response - please try again later.`,
      });
      return;
    }

    const eightballData = await eightballResponse.json();
    const embed = new EmbedBuilder({
      author: {
        name: i.user.tag,
        icon_url: i.user.displayAvatarURL(),
      },
      description: eightballData.response,
      image: {
        url: eightballData.url,
      },
    });
    const member = await i.guild?.members.fetch(i.user.id);
    if (member?.displayColor) embed.setColor(member.displayColor);
    await i.reply({ embeds: [embed] });
  },
};
