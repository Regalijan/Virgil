import { ChannelType, EmbedBuilder, Message, PartialMessage } from "discord.js";
import db from "../mongo";
import Logger from "../logger";
import SendLog from "../send_log";

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
    newMessage.channel.type === ChannelType.DM ||
    oldMessage.author.bot
  )
    return;
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: { $in: [newMessage.channel.id, newMessage.channel.parent?.id] },
      log: { $in: ["edit", null] },
    })
    .catch(Logger);
  if (ignoreData) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newMessage.guild.id })
    .catch(Logger);
  if (!settings?.editLogChannelWebhook) return;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${oldMessage.author.username} (${oldMessage.author.id})`,
      iconURL: oldMessage.author.displayAvatarURL(),
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
