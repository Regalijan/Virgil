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
  if (!settings?.threadDeleteLogChannel) return;
  const embed = new MessageEmbed()
    .setDescription(`Thread ${thread.name} deleted.`)
    .setFooter({ text: `Thread ${thread.id}` })
    .setColor([255, 0, 0]);

  const channel = await thread.guild.channels
    .fetch(settings.threadDeleteLogChannel)
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
