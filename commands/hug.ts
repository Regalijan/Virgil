import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export = {
  name: "hug",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const target = i.options.getUser("person", true);
    const hugReq = await fetch("https://nekos.life/api/v2/img/hug").catch(
      console.error,
    );

    if (!hugReq?.ok) {
      await i.reply({
        content:
          "The server is out of hugs, please try again later. (HTTP error)",
        ephemeral: true,
      });
      return;
    }

    const hugData = await hugReq.json();

    const embed = new EmbedBuilder()
      .setImage(hugData.url)
      .setDescription(`<@${i.user.id}> gives >@${target.id}> a big hug!`);

    const member = await i.guild?.members
      .fetch(i.user.id)
      .catch((e) => console.error(e));
    if (member) embed.setColor(member.displayColor);
    await i.reply({ embeds: [embed] });
  },
};
