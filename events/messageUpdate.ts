import { Message, MessageEmbed, PartialMessage } from "discord.js";
import db from "../mongo";
import SendLog from "../send_log";
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
    newMessage.channel.type === "DM" ||
    oldMessage.author.bot
  )
    return;
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: { $in: [newMessage.channel.id, newMessage.channel.parent?.id] },
      log: { $in: ["edit", null] },
    })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (ignoreData) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newMessage.guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.editLogChannelWebhook) return;
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
  await SendLog(
    settings.editLogChannelWebhook,
    embed,
    newMessage.guild,
    "editLogChannelWebhook"
  );
};
