import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
} from "discord.js";

export = {
  name: "reverify",
  async exec(i: CommandInteraction): Promise<void> {
    const button = new MessageButton()
      .setURL("https://rover.link/verify")
      .setEmoji("✏️")
      .setLabel("Change Account")
      .setStyle("LINK");
    await i.reply({
      content: "To change your verified account, click the link below.",
      components: [new MessageActionRow({ components: [button] })],
    });
  },
};
