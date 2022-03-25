import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
} from "discord.js";

export = {
  name: "reverify",
  permissions: [],
  interactionData: {
    name: "reverify",
    name_localizations: {
      "es-ES": "reverificar",
      "sv-SE": "verifiera_igen",
    },
    description: "Change your linked Roblox account",
    description_localizations: {
      "es-ES": "Cambia tu cuenta de Roblox",
      "sv-SE": "Ändra ditt Roblox-konto",
    },
  },
  async exec(i: CommandInteraction): Promise<void> {
    const button = new MessageButton()
      .setURL("https://rover.link/my/verification")
      .setEmoji("✏️")
      .setLabel("Change Account")
      .setStyle("LINK");
    await i.reply({
      content: "To change your verified account, click the link below.",
      components: [new MessageActionRow({ components: [button] })],
    });
  },
};
