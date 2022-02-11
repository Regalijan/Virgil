import { CommandInteraction } from "discord.js";
import common from "../common";
import VoicePacketReceiver from "../voice_receiver";
import Sentry from "../sentry";

export = {
  name: "autosilence",
  permissions: ["MUTE_MEMBERS"],
  interactionData: {
    name: "autosilence",
    description:
      "Automatically mute a user in voice chat if they exceed n decibels",
    options: [
      {
        type: 7,
        name: "channel",
        description: "Voice channel to monitor",
        required: true,
        channel_types: [2],
      },
      {
        type: 4,
        name: "decibels",
        description: "Decibel count to silence at",
        required: true,
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    if (!i.guild || !(await common.isPremium(i.guild)))
      return await i.reply({
        content: "Sorry, but this is a premium-only feature!",
        ephemeral: true,
      });
    const channel = i.options.getChannel("channel", true);
    if (channel.type !== "GUILD_VOICE")
      return await i.reply({
        content: "Specified channel must be a voice channel!",
        ephemeral: true,
      });
    const packetProcessor = new VoicePacketReceiver(channel);
    await i.deferReply();
    try {
      await packetProcessor.waitForJoin();
    } catch (e) {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
      await i.followUp({
        content: "Failed to join voice channel!",
        ephemeral: true,
      });
      return;
    }
    await i.followUp({
      content: `Monitoring voice activity in <#${channel.id}>`,
      ephemeral: true,
    });
    try {
      await packetProcessor.listenForPackets();
    } catch {}
  },
};
