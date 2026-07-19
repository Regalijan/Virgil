import { EmbedBuilder, VoiceState } from "discord.js";
import db from "../mongo.js";
import Logger from "../logger.js";
import SendLog from "../send_log.js";
import { type Document, type WithId } from "mongodb";

const mongo = db.db("bot");
const logStore = mongo.collection("log_channels");

export default async function (oldState: VoiceState, newState: VoiceState) {
  if (!newState.member) return;
  const ignoreData = await mongo.collection("ignored").findOne({
    channel: { $in: [newState.channel?.id, newState.channel?.parent?.id] },
    log: { $regex: "^voice_" },
  });

  const embed = new EmbedBuilder()
    .setColor(newState.member?.displayColor ?? 0)
    .setAuthor({
      name: newState.member.user?.username ?? "Unknown",
      iconURL: newState.member.user?.displayAvatarURL(),
    })
    .setFooter({ text: `ID: ${newState.member.id}` });

  let actionstring = `<@${newState.member.id}> `;
  let settingName = "";
  let webhookUrl = "";
  let logChannel: WithId<Document> | null | void;
  if (newState.channel && !oldState.channel) {
    if (ignoreData?.log === "voice_join") return;
    logChannel = await logStore
      .findOne(
        { guild: newState.guild.id, type: "voice_join" },
        { projection: { webhook: 1 } },
      )
      .catch(Logger);
    if (!logChannel) return;

    actionstring += `joined <#${newState.channelId}>`;
    settingName = "voice_join";
    webhookUrl = logChannel.webhook;
  } else if (!newState.channel && oldState.channel) {
    if (ignoreData?.log === "voice_leave") return;
    logChannel = await logStore
      .findOne(
        { guild: newState.guild.id, type: "voice_leave" },
        { projection: { webhook: 1 } },
      )
      .catch(Logger);
    if (!logChannel) return;

    actionstring += `left <#${oldState.channelId}>`;
    settingName = "voice_leave";
    webhookUrl = logChannel.webhook;
  } else if (newState.selfMute !== oldState.selfMute) {
    if (ignoreData?.log === "voice_mute") return;
    logChannel = await logStore
      .findOne(
        { guild: newState.guild.id, type: "voice_mute" },
        { projection: { webhook: 1 } },
      )
      .catch(Logger);
    if (!logChannel) return;

    actionstring += `${newState.mute ? "muted" : "unmuted"} themself.`;
    settingName = "voice_mute";
    webhookUrl = logChannel.webhook;
  } else if (newState.selfDeaf !== oldState.selfDeaf) {
    if (ignoreData?.log === "voice_deafen") return;
    logChannel = await logStore
      .findOne(
        { guild: newState.guild.id, type: "voice_deafen" },
        { projection: { webhook: 1 } },
      )
      .catch(Logger);
    if (!logChannel) return;

    actionstring += `${newState.deaf ? "deafened" : "undeafened"} themself.`;
    settingName = "voice_deafen";
    webhookUrl = logChannel.webhook;
  } else if (newState.serverMute !== oldState.serverMute) {
    if (ignoreData?.log === "voice_mute") return;
    logChannel = await logStore
      .findOne(
        { guild: newState.guild.id, type: "voice_mute" },
        { projection: { webhook: 1 } },
      )
      .catch(Logger);
    if (!logChannel) return;

    actionstring += `was ${
      newState.serverMute ? "muted" : "unmuted"
    } by a server moderator.`;
    settingName = "voice_mute";
    webhookUrl = logChannel.webhook;
  } else if (newState.serverDeaf !== oldState.serverDeaf) {
    if (ignoreData?.log === "voice_deafen") return;
    logChannel = await logStore
      .findOne(
        { guild: newState.guild.id, type: "voice_deafen" },
        { projection: { webhook: 1 } },
      )
      .catch(Logger);
    if (!logChannel) return;

    actionstring += `was ${
      newState.serverDeaf ? "deafened" : "undeafened"
    } by a server moderator.`;
    settingName = "voice_deafen";
    webhookUrl = logChannel.webhook;
  } else if (newState.selfVideo !== oldState.selfVideo) {
    if (ignoreData?.log === "voice_video") return;
    logChannel = await logStore
      .findOne(
        { guild: newState.guild.id, type: "voice_video" },
        { projection: { webhook: 1 } },
      )
      .catch(Logger);
    if (!logChannel) return;
    actionstring += `${
      newState.selfVideo ? "enabled" : "disabled"
    } their camera.`;
    settingName = "voice_video";
    webhookUrl = logChannel.webhook;
  } else if (
    newState.channel &&
    oldState.channel &&
    newState.channelId !== oldState.channelId
  ) {
    if (ignoreData?.log === "voice_switch") return;

    logChannel = await logStore
      .findOne(
        { guild: newState.guild.id, type: "voice_switch" },
        { projection: { webhook: 1 } },
      )
      .catch(Logger);

    if (!logChannel) return;
    actionstring += `switched from <#${oldState.channelId}> to <#${newState.channelId}>`;
    settingName = "voice_switch";
    webhookUrl = logChannel.webhook;
  }
  if (actionstring === `<@${newState.member.id}> `) return;
  embed.setDescription(actionstring);
  await SendLog(webhookUrl, embed, newState.guild, settingName);
}
