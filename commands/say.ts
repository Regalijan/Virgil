import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from "discord.js";

export = {
  name: "say",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const targetApiChannel = i.options.getChannel("channel") ?? i.channel;
    if (!targetApiChannel)
      throw Error("Selected channel and current channel are both null");
    if (targetApiChannel.type === ChannelType.DM) {
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
    if (target.type !== ChannelType.GuildText) {
      await i.reply({
        content: "Messages can only be sent to normal text channels.",
      });
      return;
    }
    if (!i.appPermissions?.has(PermissionsBitField.Flags.SendMessages)) {
      await i.reply({
        content:
          "Oops! I do not have permission to send messages to this channel!",
        ephemeral: true,
      });
      return;
    }
    await target.send({ content: i.options.getString("message", true) });
    await i.reply({ content: "Message sent!", ephemeral: true });
  },
};
