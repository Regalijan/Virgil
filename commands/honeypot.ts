import mongo from "../mongo.js";
import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlagsBitField,
  PermissionsBitField,
} from "discord.js";
import logger from "../logger.js";

const honeypotStore = mongo.db("bot").collection("honeypots");

export const name = "honeypot";

export async function exec(i: ChatInputCommandInteraction) {
  if (!i.guild) return;

  const subcommand = i.options.getSubcommand(true);
  const honeypots = await honeypotStore.find({ guild: i.guildId }).toArray();

  switch (subcommand) {
    case "list":
      const list = honeypots.map((h) => `<#${h.channel}>`);

      if (!list.length) {
        await i.reply({
          content: "There are no honeypot channels.",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("Honeypot Channels")
        .setDescription(honeypots.join(" "));

      await i.reply({ embeds: [embed] });
      return;

    case "add":
      const addedChannel = i.options.getChannel("channel", true);
      if (honeypots.length === 5) {
        await i.reply({
          content: "There is a limit of 5 honeypot channels per server.",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        return;
      }

      if (addedChannel.type !== ChannelType.GuildText) {
        await i.reply({
          content: "Channel must be an ordinary text channel",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        return;
      }

      if (honeypots.find((h) => h.channel === addedChannel.id)) {
        await i.reply({
          content: "Channel is already designated as a honeypot channel.",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        return;
      }

      await honeypotStore.insertOne({
        channel: addedChannel.id,
        guild: i.guildId,
      });
      await i.reply({
        content: "Honeypot Added",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });

      try {
        const fetchedChannel = await i.guild.channels.fetch(addedChannel.id);

        if (
          fetchedChannel?.isTextBased() &&
          i.guild.members.me &&
          fetchedChannel
            ?.permissionsFor(i.guild.members.me)
            ?.has(PermissionsBitField.Flags.SendMessages)
        ) {
          await fetchedChannel.send({
            content:
              "# For your safety, do not send messages in this channel.\nYou will be banned and be at the mercy of server staff should you ignore this warning. This channel exists to catch scammers and other unsavory people (and bots).\nIf you are looking for some dumb entertainment, please consider the `/selfban` command.",
          });
        }
      } catch (e) {
        logger(e);
      }
      break;

    case "remove":
      const removedChannel = i.options.getChannel("channel", true);
      if (!honeypots.find((h) => h.channel === removedChannel.id)) {
        await i.reply({
          content: "That channel is not a honeypot",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        return;
      }

      await honeypotStore.deleteOne({
        channel: removedChannel.id,
        guild: i.guildId,
      });
      await i.reply({
        content: "Honeypot Removed",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      break;

    default:
      await i.reply({
        content: "How did you even get here? (Reached default switch case)",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
  }
}
