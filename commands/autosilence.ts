import { CommandInteraction } from "discord.js";
import common from "../common";
import VoicePacketReceiver from "../voice_receiver";
import Sentry from "../sentry";

export = {
  name: "autosilence",
  permissions: ["MUTE_MEMBERS"],
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
    if (!i.guild.me || !channel.permissionsFor(i.guild.me).has("CONNECT"))
      return await i.reply({
        content: "I do not have permission to join that voice channel!",
        ephemeral: true,
      });
    await i.deferReply();
    const packetProcessor = new VoicePacketReceiver(channel);
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
      packetProcessor.voiceEvents.on("max", async (uid: string) => {
        const voiceMember = await i.guild?.members
          .fetch(uid)
          .catch(console.error);
        if (
          !voiceMember?.voice ||
          !i.guild?.me?.permissionsIn(channel).has("MUTE_MEMBERS")
        )
          return;
        await voiceMember.voice.setMute(true, "User reached max volume");
      });
      packetProcessor.listenForPackets().then(() => {});
    } catch {}
  },
};
