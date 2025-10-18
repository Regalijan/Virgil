import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlagsBitField,
} from "discord.js";

export = {
  name: "noobdetector",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const target = i.options.getUser("person", true);
    const member = await i.guild?.members
      .fetch(target.id)
      .catch((e) => console.error(e));
    if (!member) {
      await i.reply({
        content: "Oops! I could not find that member in the server.",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    const embed = new EmbedBuilder({
      title: "Noob Detector",
      author: {
        name: member.user.tag,
        icon_url: member.user.displayAvatarURL(),
      },
      color: member.displayColor,
    });
    embed.addFields({
      name: "Noob Level",
      value: `${Math.round(Math.random() * 100)} out of 100`,
    });
    await i.reply({ embeds: [embed] });
  },
};
