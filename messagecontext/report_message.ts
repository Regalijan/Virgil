import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageContextMenuCommandInteraction,
  MessageFlagsBitField,
} from "discord.js";
import mongo from "../mongo";
import Logger from "../logger";
import SendLog from "../send_log";
const logStore = mongo.db("bot").collection("log_channels");
const reportStore = mongo.db("bot").collection("reports");

export = {
  name: "Report Message to Server Mods",
  async exec(i: MessageContextMenuCommandInteraction): Promise<void> {
    if (!i.guild) return;

    const message = await i.channel?.messages.fetch(i.targetId).catch(Logger);
    if (!message) {
      await i.reply({
        content: "An error occurred locating the message! Was it deleted?",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    const actionChannel = await logStore.findOne({
      guild: i.guildId,
      type: "message_reports",
    });

    if (!actionChannel?.channel) {
      await i.reply({
        content: "Message reporting is disabled in this server.",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    const channel = await i.guild?.channels
      .fetch(actionChannel.channel)
      .catch(Logger);
    if (!channel || channel.type !== ChannelType.GuildText) {
      await i.reply({
        content:
          "Your report was not sent! The channel set by server moderation could not be found.",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    const reportInsertResponse = await reportStore.insertOne({
      message: {
        channel: message.channelId,
        content: message.content,
        guild: message.guildId,
        id: message.id,
        author: message.author.id,
      },
      reporter: {
        id: i.user.id,
        username: i.user.username,
      },
      created: Date.now(),
    });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: i.user.tag,
        iconURL: i.user.displayAvatarURL(),
      })
      .setTitle("Message Report")
      .setColor([255, 0, 0])
      .setDescription(`**Reported Message:** ${message.content}`)
      .addFields(
        {
          name: "Message Author",
          value: `${message.author.username} (${message.author.id})`,
        },
        { name: "Message ID", value: message.id },
        { name: "Channel ID", value: message.channelId },
        {
          name: "Report ID",
          value: reportInsertResponse.insertedId.toString(),
        },
      );

    const actionRow1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder({
        customId: "msg_report_ban",
        emoji: "🔨",
        label: "Ban",
        style: ButtonStyle.Danger,
      }),
      new ButtonBuilder({
        customId: "msg_report_delete",
        emoji: "❌",
        label: "Delete",
        style: ButtonStyle.Danger,
      }),
      new ButtonBuilder({
        customId: "msg_report_kick",
        emoji: "👢",
        label: "Kick",
        style: ButtonStyle.Danger,
      }),
      new ButtonBuilder({
        customId: "msg_report_mute",
        emoji: "🔇",
        label: "Mute",
        style: ButtonStyle.Danger,
      }),
      new ButtonBuilder({
        customId: "msg_report_warn",
        emoji: "⚠",
        label: "Warn",
        style: ButtonStyle.Primary,
      }),
    );

    const ignActionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder({
        customId: "msg_report_ignore",
        emoji: "❎",
        label: "Ignore",
        style: ButtonStyle.Secondary,
      }),
    );

    await SendLog(
      actionChannel.webhook,
      embed,
      i.guild,
      "messageReportChannelWebhook",
      [actionRow1, ignActionRow],
    );

    await i.reply({
      content: `Report sent! For reference, your report ID is \`${reportInsertResponse.insertedId}\``,
      flags: [MessageFlagsBitField.Flags.Ephemeral],
    });
  },
};
