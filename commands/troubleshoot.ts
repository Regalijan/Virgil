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
    name_localizations: {
      "es-ES": "solución_de_problemas",
      "sv-SE": "lös_problem",
    },
    description: "Troubleshoot Roblox verification connection issues.",
    description_localizations: {
      "es-ES": "Soluciona problemas de conexión con la verificación de Roblox.",
      "sv-SE": "Lös problem med Roblox verifieringsanslutning.",
    },
  },
  async exec(i: CommandInteraction): Promise<void> {
    const button = new MessageButton()
      .setURL(
        `https://rover.link/validate/${Buffer.from(
          encodeURIComponent(`${i.user.id};${i.user.tag}`)
        ).toString("base64")}`
      )
      .setEmoji("ℹ")
      .setLabel("Open Troubleshooting Page")
      .setStyle("LINK");

    await i.reply({
      content: "Click the button to continue.",
      ephemeral: true,
      components: [new MessageActionRow({ components: [button] })],
    });
  },
};
