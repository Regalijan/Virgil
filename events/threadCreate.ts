import { MessageEmbed, ThreadChannel } from "discord.js";
import db from "../mongo";
import Sentry from "../sentry";

const mongo = db.db("bot");

module.exports = async function (thread: ThreadChannel) {
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: thread.guildId })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.threadCreateLogChannel) return;
  const embed = new MessageEmbed()
    .setDescription(`Thread <#${thread.id}> created by <@${thread.ownerId}>`)
    .setFooter({ text: `Thread ${thread.id}` })
    .setColor([0, 255, 0]);

  const channel = await thread.guild.channels
    .fetch(settings.threadCreateLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (
    !channel ||
    channel.type !== "GUILD_TEXT" ||
    !thread.guild.me?.permissionsIn(channel).has("SEND_MESSAGES")
  )
    return;
  await channel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
};
