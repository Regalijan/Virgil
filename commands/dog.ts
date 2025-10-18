import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlagsBitField,
} from "discord.js";

export = {
  name: "dog",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const dogReq = await fetch("https://dog.ceo/api/breeds/image/random").catch(
      () => {},
    );

    if (!dogReq?.ok) {
      await i.reply({
        content:
          "The dog giver is on break, please try again later. (HTTP Error)",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    const dogData = await dogReq.json();

    const embed = new EmbedBuilder()
      .setTitle(":dog: Woof!")
      .setImage(dogData.message);

    const member = await i.guild?.members
      .fetch(i.user.id)
      .catch((e) => console.error(e));
    if (member) embed.setColor(member.displayColor);
    await i.reply({ embeds: [embed] });
  },
};
