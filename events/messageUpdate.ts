import { EmbedBuilder, Message, PartialMessage } from "discord.js";
import db from "../mongo.js";
import Logger from "../logger.js";
import SendLog from "../send_log.js";

const mongo = db.db("bot");

export default async function (
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage,
) {
  if (
    !oldMessage ||
    !oldMessage.content ||
    !oldMessage.author ||
    oldMessage.content === newMessage.content ||
    !newMessage.guild ||
    newMessage.channel.isDMBased() ||
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

  const logChannel = await mongo
    .collection("log_channels")
    .findOne(
      { guild: newMessage.guildId, type: "edit" },
      { projection: { webhook: 1 } },
    );

  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${oldMessage.author.username} (${oldMessage.author.id})`,
      iconURL: oldMessage.author.displayAvatarURL(),
    })
    .setDescription(
      `Message edited in <#${newMessage.channel.id}> [Go to message](${newMessage.url})`,
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
      },
    );
  if (newMessage.member) embed.setColor(newMessage.member.displayColor);
  await SendLog(logChannel.webhook, embed, newMessage.guild, "edit");
}
