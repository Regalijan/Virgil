import {
  AudioReceiveStream,
  entersState,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import { opus } from "prism-media";

export default class VoicePacketReceiver {
  private readonly decoder: opus.Decoder;
  private readonly voiceConnection: VoiceConnection;
  private subscriptions: Map<string, AudioReceiveStream>;
  constructor(channel: VoiceChannel) {
    if (channel.guild.me?.voice.channel)
      throw new Error("Already in voice channel for guild!");
    this.voiceConnection = joinVoiceChannel({
      adapterCreator: channel.guild.voiceAdapterCreator,
      channelId: channel.id,
      guildId: channel.guild.id,
      selfDeaf: false,
      selfMute: true,
    });
    this.decoder = new opus.Decoder({
      rate: 48000,
      channels: 2,
      frameSize: 960,
    });
    this.subscriptions = new Map<string, AudioReceiveStream>();
  }

  async waitForJoin() {
    await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 10000);
  }

  async listenForPackets() {
    const { receiver } = this.voiceConnection;

    receiver.speaking.on("start", (uid) => {
      const stream = receiver.subscribe(uid);
      stream.pipe(this.decoder);
    });
    receiver.speaking.on("end", (uid) => {
      receiver.subscriptions.delete(uid);
      if (receiver.speaking.users.size) return;
      this.voiceConnection.disconnect();
      this.voiceConnection.destroy();
      receiver.speaking.removeAllListeners();
      this.decoder.destroy();
    });
    this.voiceConnection.on(VoiceConnectionStatus.Signalling, (_oldState, newState) => {
      if (!["destroyed", "disconnected"].includes(newState.status)) return;
      receiver.speaking.removeAllListeners();
      receiver.subscriptions.clear();
      this.voiceConnection.removeAllListeners();
      try {
        this.voiceConnection.disconnect();
        this.voiceConnection.destroy();
        this.decoder.destroy();
      } catch {}
    });
    this.decoder.on("data", (data) => {
      console.log(Buffer.from(data).toString("utf-8"));
    });
  }
}
