import { Message, MessageEmbed, PartialMessage, TextChannel } from "discord.js";
import db from "../mongo";
import Sentry from "../sentry";

const mongo = db.db("bot");

module.exports = async function (message: Message<boolean> | PartialMessage) {
  if (!message.guild || !message.author || message.author.bot) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: message.guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.deleteLogChannel) return;
  const embed = new MessageEmbed()
    .setAuthor({
      name: `${message.author.tag} (${message.author.id})`,
      iconURL: message.author.displayAvatarURL({ dynamic: true }),
    })
    .setDescription(
      `Message ${message.id} deleted from <#${message.channel.id}>${
        message.thread ? ` - Thread ${message.thread.name}` : ""
      }${message.content ? `\n**Content:** ${message.content}` : ""}`
    );
  if (message.member) embed.setColor(message.member.displayColor);
  message.attachments.forEach((att) => {
    embed.addField("Attachment", att.url);
  });
  const channel = await message.guild.channels
    .fetch(settings.deleteLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!(channel instanceof TextChannel)) return;
  if (!message.client.user?.id) return;
  if (!channel?.permissionsFor(message.client.user.id)?.has("SEND_MESSAGES"))
    return;
  await channel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
};
