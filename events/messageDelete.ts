import { ChannelType, EmbedBuilder, Message, PartialMessage } from "discord.js";
import db from "../mongo";
import Logger from "../logger";
import SendLog from "../send_log";

const mongo = db.db("bot");

module.exports = async function (message: Message | PartialMessage) {
  if (
    message.channel.type === ChannelType.DM ||
    !message.guild ||
    !message.author ||
    message.author.bot
  )
    return;
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: { $in: [message.channel.id, message.channel.parent?.id] },
      log: { $in: ["delete", null] },
    })
    .catch(Logger);
  if (ignoreData) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: message.guild.id })
    .catch(Logger);
  if (!settings?.deleteLogChannelWebhook) return;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${message.author.username} (${message.author.id})`,
      iconURL: message.author.displayAvatarURL(),
    })
    .setDescription(
      `Message ${message.id} deleted from <#${message.channel.id}>${
        message.thread ? ` - Thread ${message.thread.name}` : ""
      }${message.content ? `\n**Content:** ${message.content}` : ""}`,
    );
  if (message.member) embed.setColor(message.member.displayColor);
  message.attachments.forEach((att) => {
    embed.addFields({ name: "Attachment", value: att.url });
  });
  await SendLog(
    settings.deleteLogChannelWebhook,
    embed,
    message.guild,
    "deleteLogChannelWebhook",
  );
};
