import { CommandInteraction } from "discord.js";

export = {
  name: "say",
  permissions: ["ADMINISTRATOR"],
  interactionData: {
    name: "say",
    name_localizations: {
      "es-ES": "decir",
      "sv-SE": "säga",
    },
    description: "Say something",
    description_localizations: {
      "es-ES": "Decir algo",
      "sv-SE": "Säga något",
    },
    options: [
      {
        type: 3,
        name: "message",
        name_localizations: {
          "es-ES": "mensaje",
          "sv-SE": "meddelande",
        },
        description: "Message to say",
        description_localizations: {
          "es-ES": "Mensaje a decir",
          "sv-SE": "Meddelande att säga",
        },
        required: true,
      },
      {
        type: 7,
        name: "channel",
        name_localizations: {
          "es-ES": "canal",
          "sv-SE": "kanal",
        },
        description: "Where to send the message",
        description_localizations: {
          "es-ES": "Canal donde enviar el mensaje",
          "sv-SE": "Vart ska meddelandet skickas",
        },
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const targetApiChannel = i.options.getChannel("channel") ?? i.channel;
    if (!targetApiChannel)
      throw Error("Selected channel and current channel are both null");
    if (targetApiChannel.type === "DM") {
      await i.reply({
        content: "Sorry but DM channels cannot be used with this command.",
        ephemeral: true,
      });
      return;
    }
    const target = await i.guild?.channels.fetch(targetApiChannel.id);
    if (!target)
      throw Error(
        "Unable to fetch GuildChannel from APIInteractionResolvedDataChannel"
      );
    if (!i.client.user) throw Error("ClientUser is null");
    if (target.type !== "GUILD_TEXT") {
      await i.reply({
        content: "Messages can only be sent to normal text channels.",
      });
      return;
    }
    if (!target.permissionsFor(i.client.user.id)?.has("SEND_MESSAGES")) {
      await i.reply({
        content:
          "Oops! I do not have permission to send messages to this channel!",
        ephemeral: true,
      });
      return;
    }
    await target.send({ content: i.options.getString("message") });
    await i.reply({ content: "Message sent!", ephemeral: true });
  },
};
