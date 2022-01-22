import {
  CategoryChannel,
  MessageEmbed,
  NewsChannel,
  StageChannel,
  StoreChannel,
  TextChannel,
  VoiceChannel,
  VoiceState,
} from "discord.js";
import db from "../mongo";
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
    .setColor(newState.member.displayColor)
    .setAuthor({
      name: newState.member.user.tag,
      iconURL: newState.member.user.displayAvatarURL({ dynamic: true }),
    })
    .setFooter({ text: `ID: ${newState.member.id}` });

  let actionstring = `<@${newState.member.id}> `;
  let logChannel:
    | void
    | TextChannel
    | NewsChannel
    | VoiceChannel
    | CategoryChannel
    | StageChannel
    | StoreChannel
    | null;
  if (newState.channel && !oldState.channel && settings.voiceJoinLogChannel) {
    actionstring += `joined <#${newState.channelId}>`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceJoinLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  } else if (
    !newState.channel &&
    oldState.channel &&
    settings.voiceLeaveLogChannel
  ) {
    actionstring += `left <#${oldState.channelId}>`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceLeaveLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  } else if (
    newState.selfMute !== oldState.selfMute &&
    settings.voiceMuteLogChannel
  ) {
    actionstring += `${newState.mute ? "muted" : "unmuted"} themself.`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceMuteLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  } else if (
    newState.selfDeaf !== oldState.selfDeaf &&
    settings.voiceDeafenLogChannel
  ) {
    actionstring += `${newState.deaf ? "deafened" : "undeafened"} themself.`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceDeafenLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  } else if (
    newState.serverMute !== oldState.serverMute &&
    settings.voiceMuteLogChannel
  ) {
    actionstring += `was ${
      newState.serverMute ? "muted" : "unmuted"
    } by a server moderator.`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceMuteLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  } else if (
    newState.serverDeaf !== oldState.serverDeaf &&
    settings.voiceDeafenLogChannel
  ) {
    actionstring += `was ${
      newState.serverDeaf ? "deafened" : "undeafened"
    } by a server moderator.`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceDeafenLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  } else if (
    newState.selfVideo !== oldState.selfVideo &&
    settings.voiceVideoLogChannel
  ) {
    actionstring += `${
      newState.selfVideo ? "enabled" : "disabled"
    } their camera.`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceVideoLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  } else if (
    newState.channel &&
    oldState.channel &&
    settings.voiceSwitchLogChannel &&
    newState.channelId !== oldState.channelId
  ) {
    actionstring += `switched from <#${oldState.channelId}> to <#${newState.channelId}>`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceSwitchLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  }
  if (
    actionstring === `<@${newState.member.id}> ` ||
    logChannel?.type !== "GUILD_TEXT" ||
    !newState.client.user ||
    !logChannel?.permissionsFor(newState.client.user.id)?.has("SEND_MESSAGES")
  )
    return;
  embed.setDescription(actionstring);
  await logChannel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.log(e);
  });
};
