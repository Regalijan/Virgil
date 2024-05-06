import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
} from "discord.js";

export = {
  name: "reverify",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const button = new ButtonBuilder()
      .setURL("https://registry.virgil.gg/me")
      .setEmoji("✏")
      .setLabel("Change Account")
      .setStyle(ButtonStyle.Link);
    await i.reply({
      content: "To change your verified account, click the link below.",
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)],
    });
  },
};
