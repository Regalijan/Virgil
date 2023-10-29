import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
} from "discord.js";

export = {
  name: "troubleshoot",
  async exec(i: CommandInteraction): Promise<void> {
    const button = new ButtonBuilder()
      .setURL(
        `https://rover.link/validate/${Buffer.from(
          encodeURIComponent(`${i.user.id};${i.user.tag}`),
        ).toString("base64")}`,
      )
      .setEmoji("ℹ")
      .setLabel("Open Troubleshooting Page")
      .setStyle(ButtonStyle.Link);

    await i.reply({
      content: "Click the button to continue.",
      ephemeral: true,
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)],
    });
  },
};
