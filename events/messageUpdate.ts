import { Message, MessageEmbed, PartialMessage, TextChannel } from "discord.js";
import db from "../mongo";
import Sentry from "../sentry";

const mongo = db.db("bot");

module.exports = async function (
  oldMessage: Message<boolean> | PartialMessage,
  newMessage: Message<boolean> | PartialMessage
) {
  if (
    !oldMessage ||
    !oldMessage.content ||
    !oldMessage.author ||
    oldMessage.content === newMessage.content ||
    !newMessage.guild ||
    oldMessage.author.bot
  )
    return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newMessage.guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.editLogChannel) return;
  const embed = new MessageEmbed()
    .setAuthor({
      name: `${oldMessage.author.tag} (${oldMessage.author.id})`,
      iconURL: oldMessage.author.displayAvatarURL({ dynamic: true }),
    })
    .setDescription(
      `Message edited in <#${newMessage.channel.id}> [Go to message](${newMessage.url})`
    )
    .addFields(
      {
        name: "Before",
        value: oldMessage.content
          ? oldMessage.content.length > 1024
            ? oldMessage.content.substring(0, 1021) + "..."
            : oldMessage.content
          : "Unknown content",
      },
      {
        name: "After",
        value: newMessage.content
          ? newMessage.content.length > 1024
            ? newMessage.content.substring(0, 1021) + "..."
            : newMessage.content
          : "Unknown content",
      }
    );
  if (newMessage.member) embed.setColor(newMessage.member.displayColor);
  const channel = await newMessage.guild.channels
    .fetch(settings.editLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (
    !channel ||
    !(channel instanceof TextChannel) ||
    !newMessage.client.user?.id ||
    !channel.permissionsFor(newMessage.client.user.id)?.has("SEND_MESSAGES")
  )
    return;
  await channel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
};
