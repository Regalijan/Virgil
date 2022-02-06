import { MessageEmbed, VoiceState } from "discord.js";
import db from "../mongo";
import SendLog from "../send_log";
import Sentry from "../sentry";

const mongo = db.db("bot");

module.exports = async function (oldState: VoiceState, newState: VoiceState) {
  if (!newState.member) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newState.guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings) return;
  const embed = new MessageEmbed()
    .setColor(newState.member?.displayColor ?? 0)
    .setAuthor({
      name: newState.member.user.tag,
      iconURL: newState.member.user.displayAvatarURL({ dynamic: true }),
    })
    .setFooter({ text: `ID: ${newState.member.id}` });

  let actionstring = `<@${newState.member.id}> `;
  let settingName = "";
  if (newState.channel && !oldState.channel && settings.voiceJoinLogChannel) {
    actionstring += `joined <#${newState.channelId}>`;
    settingName = "voiceJoinLogChannelWebhook";
  } else if (
    !newState.channel &&
    oldState.channel &&
    settings.voiceLeaveLogChannel
  ) {
    actionstring += `left <#${oldState.channelId}>`;
    settingName = "voiceLeaveLogChannelWebhook";
  } else if (
    newState.selfMute !== oldState.selfMute &&
    settings.voiceMuteLogChannel
  ) {
    actionstring += `${newState.mute ? "muted" : "unmuted"} themself.`;
    settingName = "voiceMuteLogChannelWebhook";
  } else if (
    newState.selfDeaf !== oldState.selfDeaf &&
    settings.voiceDeafenLogChannel
  ) {
    actionstring += `${newState.deaf ? "deafened" : "undeafened"} themself.`;
    settingName = "voiceDeafenLogChannelWebhook";
  } else if (
    newState.serverMute !== oldState.serverMute &&
    settings.voiceMuteLogChannel
  ) {
    actionstring += `was ${
      newState.serverMute ? "muted" : "unmuted"
    } by a server moderator.`;
    settingName = "voiceMuteLogChannelWebhook";
  } else if (
    newState.serverDeaf !== oldState.serverDeaf &&
    settings.voiceDeafenLogChannel
  ) {
    actionstring += `was ${
      newState.serverDeaf ? "deafened" : "undeafened"
    } by a server moderator.`;
    settingName = "voiceDeafenLogChannelWebhook";
  } else if (
    newState.selfVideo !== oldState.selfVideo &&
    settings.voiceVideoLogChannel
  ) {
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
    actionstring += `switched from <#${oldState.channelId}> to <#${newState.channelId}>`;
    settingName = "voiceSwitchLogChannelWebhook";
  }
  if (actionstring === `<@${newState.member.id}> `) return;
  embed.setDescription(actionstring);
  await SendLog(settings[settingName], embed, newState.guild, settingName);
};
