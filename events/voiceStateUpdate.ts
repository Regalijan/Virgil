import { EmbedBuilder, VoiceState } from "discord.js";
import db from "../mongo";
import Logger from "../logger";
import SendLog from "../send_log";

const mongo = db.db("bot");

module.exports = async function (oldState: VoiceState, newState: VoiceState) {
  if (!newState.member) return;
  const ignoreData = await mongo.collection("ignored").findOne({
    channel: { $in: [newState.channel?.id, newState.channel?.parent?.id] },
    log: { $regex: "^voice_" },
  });
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newState.guild.id })
    .catch(Logger);
  if (!settings) return;
  const embed = new EmbedBuilder()
    .setColor(newState.member?.displayColor ?? 0)
    .setAuthor({
      name: newState.member.user.tag,
      iconURL: newState.member.user.displayAvatarURL(),
    })
    .setFooter({ text: `ID: ${newState.member.id}` });

  let actionstring = `<@${newState.member.id}> `;
  let settingName = "";
  if (newState.channel && !oldState.channel && settings.voiceJoinLogChannel) {
    if (ignoreData?.log === "voice_join") return;
    actionstring += `joined <#${newState.channelId}>`;
    settingName = "voiceJoinLogChannelWebhook";
  } else if (
    !newState.channel &&
    oldState.channel &&
    settings.voiceLeaveLogChannel
  ) {
    if (ignoreData?.log === "voice_leave") return;
    actionstring += `left <#${oldState.channelId}>`;
    settingName = "voiceLeaveLogChannelWebhook";
  } else if (
    newState.selfMute !== oldState.selfMute &&
    settings.voiceMuteLogChannel
  ) {
    if (ignoreData?.log === "voice_mute") return;
    actionstring += `${newState.mute ? "muted" : "unmuted"} themself.`;
    settingName = "voiceMuteLogChannelWebhook";
  } else if (
    newState.selfDeaf !== oldState.selfDeaf &&
    settings.voiceDeafenLogChannel
  ) {
    if (ignoreData?.log === "voice_deafen") return;
    actionstring += `${newState.deaf ? "deafened" : "undeafened"} themself.`;
    settingName = "voiceDeafenLogChannelWebhook";
  } else if (
    newState.serverMute !== oldState.serverMute &&
    settings.voiceMuteLogChannel
  ) {
    if (ignoreData?.log === "voice_mute") return;
    actionstring += `was ${
      newState.serverMute ? "muted" : "unmuted"
    } by a server moderator.`;
    settingName = "voiceMuteLogChannelWebhook";
  } else if (
    newState.serverDeaf !== oldState.serverDeaf &&
    settings.voiceDeafenLogChannel
  ) {
    if (ignoreData?.log === "voice_deafen") return;
    actionstring += `was ${
      newState.serverDeaf ? "deafened" : "undeafened"
    } by a server moderator.`;
    settingName = "voiceDeafenLogChannelWebhook";
  } else if (
    newState.selfVideo !== oldState.selfVideo &&
    settings.voiceVideoLogChannel
  ) {
    if (ignoreData?.log === "voice_video") return;
    actionstring += `${
      newState.selfVideo ? "enabled" : "disabled"
    } their camera.`;
    settingName = "voiceVideoLogChannelWebhook";
  } else if (
    newState.channel &&
    oldState.channel &&
    settings.voiceSwitchLogChannel &&
    newState.channelId !== oldState.channelId
  ) {
    if (ignoreData?.log === "voice_video") return;
    actionstring += `switched from <#${oldState.channelId}> to <#${newState.channelId}>`;
    settingName = "voiceSwitchLogChannelWebhook";
  }
  if (actionstring === `<@${newState.member.id}> `) return;
  embed.setDescription(actionstring);
  await SendLog(settings[settingName], embed, newState.guild, settingName);
};
