import {
  AudioReceiveStream,
  entersState,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import { opus } from "prism-media";
import { execSync } from "child_process";
import { EventEmitter } from "events";

export default class VoicePacketReceiver {
  private readonly decoder: opus.Decoder;
  private readonly voiceConnection: VoiceConnection;
  private subscriptions: Map<string, AudioReceiveStream>;
  voiceEvents: EventEmitter;
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
    this.voiceEvents = new EventEmitter();
  }

  async waitForJoin() {
    await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 10000);
  }

  async listenForPackets() {
    const { receiver } = this.voiceConnection;

    receiver.speaking.on("start", (uid) => {
      const stream = receiver.subscribe(uid);
      this.decoder.on("data", (data) => {
        if (!Buffer.from(data).toString("binary").match(/1/)) return; // Buffer is all zeroes (no data)
        let returnedBuf: Buffer;
        console.log("Attempting volume detection");
        try {
          returnedBuf = execSync(
            "ffmpeg -i - -filter:a volumedetect -f null /dev/null",
            { input: data }
          );
          console.log("LENGTH:", returnedBuf?.length ?? 0);
          if (!returnedBuf) {
            console.log("Error:\n", returnedBuf);
            return;
          }
        } catch (e: any) {
          console.error("STDERR:\n", e);
          return;
        }
        const result = returnedBuf.toString();
        const meanVolMatch = result.match(/mean_volume: (-?\d+\.\d+)/m);
        const maxVolMatch = result.match(/max_volume: (-?\d+\.\d+)/m);
        if (!meanVolMatch?.length || !maxVolMatch?.length) {
          console.log("Could not find max or mean volume");
          return;
        }
        const maxVol = parseFloat(maxVolMatch[1]);
        const meanVol = parseFloat(meanVolMatch[1]);
        if (maxVol === 0.0) this.voiceEvents.emit("max", uid);
        console.log(maxVol, meanVol);
      });
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
    this.voiceConnection.on(VoiceConnectionStatus.Disconnected, () => {
      receiver.speaking.removeAllListeners();
      receiver.subscriptions.clear();
      this.voiceConnection.removeAllListeners();
      this.decoder.destroy();
      try {
        this.voiceConnection.destroy();
      } catch {}
    });
    this.voiceConnection.on(VoiceConnectionStatus.Destroyed, () => {
      receiver.speaking.removeAllListeners();
      receiver.subscriptions.clear();
      this.voiceConnection.removeAllListeners();
      this.decoder.destroy();
    });
  }
}
