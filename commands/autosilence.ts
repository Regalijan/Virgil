import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionsBitField,
  VoiceChannel,
} from "discord.js";
import common from "../common";
import Logger from "../logger";
import VoicePacketReceiver from "../voice_receiver";

export = {
  name: "autosilence",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    if (!i.guild || !(await common.isPremium(i.guild))) {
      await i.reply({
        content: "Sorry, but this is a premium-only feature!",
        ephemeral: true,
      });
      return;
    }
    let channel = i.options.getChannel("channel", true);
    if (channel.type !== ChannelType.GuildVoice) {
      await i.reply({
        content: "Specified channel must be a voice channel!",
        ephemeral: true,
      });
      return;
    }
    channel = channel as VoiceChannel;
    const { Flags } = PermissionsBitField;
    if (!i.guild.members.me || !i.appPermissions?.has(Flags.Connect)) {
      await i.reply({
        content: "I do not have permission to join that voice channel!",
        ephemeral: true,
      });
      return;
    }
    await i.deferReply();
    const packetProcessor = new VoicePacketReceiver(channel);
    try {
      await packetProcessor.waitForJoin();
    } catch (e) {
      Logger(e);
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
        if (!voiceMember?.voice || !i.appPermissions?.has(Flags.MuteMembers))
          return;
        await voiceMember.voice.setMute(true, "User reached max volume");
      });
      packetProcessor.listenForPackets().then(() => {});
    } catch {}
  },
};
