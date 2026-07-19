import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  MessageFlagsBitField,
  PermissionsBitField,
  ThreadChannel,
} from "discord.js";
import mongo from "../mongo.js";
import webhookDelete from "../webhook_delete.js";
import logger from "../logger.js";
const db = mongo.db("bot");
const logChannelStore = db.collection("log_channels");
const ignoredDB = mongo.db("bot").collection("ignored");

export const name = "logs";

export async function exec(i: ChatInputCommandInteraction): Promise<void> {
  if (!i.guild) return; // There should always be a guild

  const embed = new EmbedBuilder();
  if (i.member instanceof GuildMember) embed.setColor(i.member.displayColor);

  switch (i.options.getSubcommand(true)) {
    case "ignore":
      const ignoringChannel = i.options.getChannel("channel", true);
      if (ignoringChannel instanceof ThreadChannel) {
        await i.reply({
          content:
            "Threads cannot be ignored (they inherit the settings of their parent channel)",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        return;
      }

      const doesIgnoreExist = await ignoredDB.findOne({
        channel: ignoringChannel.id,
        log: i.options.getString("log", false),
      });
      if (doesIgnoreExist) {
        await i.reply({
          content:
            "An ignore of that type or a global ignore was already set for the channel!",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        return;
      }

      await ignoredDB.insertOne({
        channel: ignoringChannel.id,
        guild: i.guildId,
        log: i.options.getString("log", false),
      });

      await i.reply({ content: "Channel ignored!" });

      break;

    case "list":
      const allLogChannels = await logChannelStore
        .find({ guild: i.guildId })
        .toArray();
      const channelsList: Map<string, string> = new Map();

      for (const logChannel of allLogChannels)
        channelsList.set(logChannel.type, `<#${logChannel.channel}>`);

      embed.setTitle("Log channels for " + i.guild?.name);
      embed.setDescription("\u200B");
      embed.addFields(
        {
          name: "Ban logs",
          value: channelsList.get("ban") ?? "Not set",
          inline: true,
        },
        {
          name: "Delete logs",
          value: channelsList.get("delete") ?? "Not set",
          inline: true,
        },
        {
          name: "Edit logs",
          value: channelsList.get("edit") ?? "Not set",
          inline: true,
        },
        {
          name: "Member join logs",
          value: channelsList.get("member_join") ?? "Not set",
          inline: true,
        },
        {
          name: "Member leave logs",
          value: channelsList.get("member_leave") ?? "Not set",
          inline: true,
        },
        {
          name: "Message report action logs",
          value: channelsList.get("message_report_actions") ?? "Not set",
          inline: true,
        },
        {
          name: "Message reports",
          value: channelsList.get("message_reports") ?? "Not set",
          inline: true,
        },
        {
          name: "Nickname logs",
          value: channelsList.get("nickname") ?? "Not set",
          inline: true,
        },
        {
          name: "Role logs",
          value: channelsList.get("role") ?? "Not set",
          inline: true,
        },
        {
          name: "Thread creation logs",
          value: channelsList.get("thread_create") ?? "Not set",
          inline: true,
        },
        {
          name: "Thread delete logs",
          value: channelsList.get("thread_delete") ?? "Not set",
          inline: true,
        },
        {
          name: "Thread update logs",
          value: channelsList.get("thread_delete") ?? "Not set",
          inline: true,
        },
        {
          name: "Unban logs",
          value: channelsList.get("unban") ?? "Not set",
          inline: true,
        },
        {
          name: "Voice deafen logs",
          value: channelsList.get("voice_deafen") ?? "Not set",
          inline: true,
        },
        {
          name: "Voice join logs",
          value: channelsList.get("voice_join") ?? "Not set",
          inline: true,
        },
        {
          name: "Voice leave logs",
          value: channelsList.get("voice_leave") ?? "Not set",
          inline: true,
        },
        {
          name: "Voice mute logs",
          value: channelsList.get("voice_mute") ?? "Not set",
          inline: true,
        },
        {
          name: "Voice channel switch logs",
          value: channelsList.get("voice_switch") ?? "Not set",
          inline: true,
        },
        {
          name: "Voice video logs",
          value: channelsList.get("voice_video") ?? "Not set",
          inline: true,
        },
        {
          name: "Warn logs",
          value: channelsList.get("warn") ?? "Not set",
          inline: true,
        },
      );
      await i.reply({ embeds: [embed] });
      break;

    case "remove":
      const removalChoice = i.options.getString("log", true);
      const removedLog = await logChannelStore.findOneAndDelete({
        guild: i.guildId,
        type: removalChoice,
      });

      if (!removedLog) {
        await i.reply({
          content: "That log does not exist",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        return;
      }

      await i.reply({ content: `\`${removalChoice}\` log disabled!` });
      try {
        await webhookDelete(removedLog.webhook, i.guild);
      } catch (e) {
        logger(e);
      }
      break;

    case "set":
      const setChannel = await i.guild?.channels.fetch(
        i.options.getChannel("channel", true).id,
      );
      if (setChannel?.type !== ChannelType.GuildText) {
        await i.reply({
          content: "The log channel must be a normal text channel!",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        return;
      }

      const setChoice = i.options.getString("log", true);

      // It should never be zero, Discord's permission checks should prevent this
      if (
        !setChannel
          ?.permissionsFor(i.guild?.members.me?.id ?? "0")
          ?.has(PermissionsBitField.Flags.ManageWebhooks)
      ) {
        await i.reply({
          content:
            "I cannot create the webhook for the log! Please grant me permission to manage webhooks!",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
        return;
      }

      const newWebhook = await setChannel.createWebhook({
        avatar: i.client.user?.avatarURL(),
        name: `${i.client.user?.username} Logs`,
      });

      await logChannelStore.updateOne(
        { guild: i.guildId, type: setChoice },
        {
          $set: {
            channel: setChannel.id,
            webhook: newWebhook.url,
          },
          $setOnInsert: {
            guild: i.guildId,
            type: setChoice,
          },
        },
        {
          upsert: true,
        },
      );

      await i.reply({
        content: `\`${setChoice}\` log set to <#${
          i.options.getChannel("channel", true).id
        }>!`,
      });
      break;

    case "show_ignored":
      const allIgnored = await ignoredDB
        .find({
          guild: i.guildId,
        })
        .toArray();
      embed.setDescription("All ignored channels for " + i.guild?.name);
      for (const ignored of allIgnored) {
        const ignoredChannel = await i.guild?.channels
          .fetch(ignored.channel)
          .catch(() => {});
        if (!ignoredChannel) continue;
        embed.addFields({
          name: `#${ignoredChannel.name}`,
          value: "Log: " + (ignored.log ?? "All"),
        });
      }
      await i.reply({ embeds: [embed] });
      break;

    case "unignore":
      const unignoringChannel = i.options.getChannel("channel", true);
      await ignoredDB.deleteOne({
        channel: unignoringChannel.id,
        log: i.options.getString("log", false),
      });
      await i.reply({ content: "Channel unignored!" });
  }
}
