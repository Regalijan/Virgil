import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
} from "discord.js";

export = {
  name: "troubleshoot",
  permissions: [],
  interactionData: {
    name: "troubleshoot",
    description: "Troubleshoot Roblox verification connection issues.",
  },
  async exec(i: CommandInteraction): Promise<void> {
    const button = new MessageButton()
      .setURL(
        `https://rover.link/validate/${Buffer.from(
          `${i.user.id};${i.user.tag}`
        ).toString("base64")}`
      )
      .setEmoji("ℹ️")
      .setLabel("Open Troubleshooting Page")
      .setStyle("LINK");

    await i.reply({
      content: "Click the button to continue.",
      ephemeral: true,
      components: [new MessageActionRow({ components: [button] })],
    });
  },
};
