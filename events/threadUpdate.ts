import { EmbedBuilder, ThreadChannel } from "discord.js";
import db from "../mongo";
import Logger from "../logger";
import SendLog from "../send_log";

const mongo = db.db("bot");

module.exports = async function (
  oldThread: ThreadChannel,
  newThread: ThreadChannel
) {
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: { $in: [newThread.parent?.id, newThread.parent?.parent?.id] },
      log: { $in: ["thread_update", null] },
    })
    .catch(Logger);
  if (ignoreData) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newThread.guildId })
    .catch(Logger);
  if (!settings?.threadUpdateLogChannelWebhook) return;
  const embed = new EmbedBuilder()
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
  await SendLog(
    settings.threadUpdateLogChannelWebhook,
    embed,
    newThread.guild,
    "threadUpdateLogChannelWebhook"
  );
};
