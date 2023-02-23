import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
} from "discord.js";

export = {
  name: "reverify",
  async exec(i: CommandInteraction): Promise<void> {
    const button = new ButtonBuilder()
      .setURL("https://rover.link/verify")
      .setEmoji("✏")
      .setLabel("Change Account")
      .setStyle(ButtonStyle.Link);
    await i.reply({
      content: "To change your verified account, click the link below.",
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)],
    });
  },
};
