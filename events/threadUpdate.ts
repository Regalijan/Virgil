import Sentry from "../sentry";
import { MessageEmbed, ThreadChannel } from "discord.js";
import db from "../mongo";

const mongo = db.db("bot");

module.exports = async function (
  oldThread: ThreadChannel,
  newThread: ThreadChannel
) {
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newThread.guildId })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.threadUpdateLogChannel) return;
  const embed = new MessageEmbed()
    .setTitle("Thread Updated")
    .setColor([0, 0, 255])
    .setFooter({ text: `Thread ${newThread.id}` });

  let actionstring = "";
  if (!oldThread.archived && newThread.archived) {
    actionstring = `Thread <#${newThread.id}> archived.`;
  } else if (oldThread.members.cache.size < newThread.members.cache.size) {
    actionstring += `Members added to thread <#${newThread.id}>:\n`;
    newThread.members.cache.each((threadmember) => {
      if (!oldThread.members.cache.has(threadmember.id))
        actionstring += `<@${threadmember.id}> `;
    });
  } else if (oldThread.members.cache.size > newThread.members.cache.size) {
    actionstring += `Members removed from thread <#${newThread.id}>:\n`;
    oldThread.members.cache.each((threadmember) => {
      if (newThread.members.cache.has(threadmember.id))
        actionstring += `<@${threadmember.id}> `;
    });
  } else if (oldThread.name !== newThread.name) {
    actionstring += `Thread ${oldThread.name} changed to ${newThread.name}.`;
  } else if (oldThread.archived && !newThread.archived) {
    actionstring = `Thread <#${newThread.id}> unarchived.`;
  } else if (oldThread.autoArchiveDuration !== newThread.autoArchiveDuration) {
    actionstring = `Auto archive timer of <#${newThread.id}> changed from ${oldThread.autoArchiveDuration} minutes to ${newThread.autoArchiveDuration} minutes.`;
  }
  if (!actionstring) return;
  embed.setDescription(actionstring);
  const channel = await newThread.guild.channels
    .fetch(settings.threadUpdateLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (
    !channel ||
    channel.type !== "GUILD_TEXT" ||
    !newThread.guild.me?.permissionsIn(channel).has("SEND_MESSAGES")
  )
    return;
  await channel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
};