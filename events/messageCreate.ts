import { Message, PermissionsBitField, TextChannel } from "discord.js";
import db from "../mongo.js";
import Logger from "../logger.js";
import redis from "../redis.js";
import { verify } from "../common.js";

const mongo = db.db("bot");

export default async function (message: Message) {
  if (!message.guild || !message.member || message.channel.isDMBased()) return;

  const banMessageSettings = await mongo
    .collection("ban_messages")
    .findOne(
      { guild: message.guildId },
      { projection: { message_content: 1 } },
    );

  if (
    message.channel.isTextBased() &&
    message.guild.members.me?.permissions.has(
      PermissionsBitField.Flags.BanMembers,
    ) &&
    message.member?.bannable
  ) {
    try {
      const honeypots = await mongo
        .collection("honeypots")
        .findOne({ channel: message.channelId, guild: message.guild.id });

      if (honeypots) {
        let banMessage = `You have been banned from ${message.guild.name} because your account has potentially been compromised. Please change your password and enable multi-factor authentication if you have not already done so. If your account has not been compromised and you disobeyed the instructions, well that sucks for you. Maybe you should learn how to read.`;

        if (banMessageSettings)
          banMessage += `\n\n${banMessageSettings.message_content}`;

        try {
          await message.author.send({ content: banMessage });
        } catch {}

        await message.member.ban({
          deleteMessageSeconds: 300,
          reason: "Sent a message in a honeypot channel",
        });
      }
    } catch (e) {
      Logger(e);
    }
  }

  const shouldVerify =
    Math.random() <= 0.005 &&
    !(await redis.get(`recentlyverified_${message.author.id}`));

  if (shouldVerify && message.member) await verify(message.member, false);

  const bypasses = await mongo
    .collection("filter_bypass")
    .find({ server: message.guildId })
    .toArray();
  if (
    bypasses.find(
      (b) =>
        b.id === message.channel.id ||
        b.id === message.author.id ||
        b.id === message.channel ||
        (message.channel instanceof TextChannel &&
          b.id === message.channel.parentId) ||
        message.member?.roles.cache.has(b.id),
    )
  )
    return;
  if (
    !message.member?.permissions.has(PermissionsBitField.Flags.Administrator) &&
    message.guild.members.me &&
    message.channel
      .permissionsFor(message.guild.members.me)
      ?.has(PermissionsBitField.Flags.ManageMessages)
  ) {
    try {
      const banned_words = mongo
        .collection("banned_words")
        .find({ server: message.guildId });

      for (const word of await banned_words.toArray()) {
        if (word.type === 1) {
          // Exact matches
          if (
            (message.content === word.filter ||
              (!word.case_sensitive &&
                message.content.toLowerCase() === word.filter.toLowerCase())) &&
            message.deletable
          ) {
            await message.delete();
            return;
          }
        } else if (word.type === 2) {
          // Wildcard matches
          if (
            (message.content.search(word.filter) > -1 ||
              (!word.case_sensitive &&
                message.content
                  .toLowerCase()
                  .search(word.filter.toLowerCase()))) &&
            message.deletable
          ) {
            await message.delete();
            return;
          }
        }
      }
    } catch (e) {
      Logger(e);
    }
  }
}
