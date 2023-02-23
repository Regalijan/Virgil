import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageContextMenuCommandInteraction,
  PermissionsBitField,
} from "discord.js";
import { createHash, randomBytes } from "crypto";
import mongo from "../mongo";
import SendLog from "../send_log";
import Sentry from "../sentry";
const settingsStore = mongo.db("bot").collection("settings");
const reportStore = mongo.db("bot").collection("reports");

export = {
  name: "Report Message to Server Mods",
  async exec(i: MessageContextMenuCommandInteraction): Promise<void> {
    const message = await i.channel?.messages.fetch(i.targetId).catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
    if (!message) {
      await i.reply({
        content: "An error occurred locating the message! Was it deleted?",
        ephemeral: true,
      });
      return;
    }

    const settings = await settingsStore.findOne({ guild: i.guildId });
    if (!settings?.messageReportChannel) {
      await i.reply({
        content: "Message reporting is disabled in this server.",
        ephemeral: true,
      });
      return;
    }

    const channel = await i.guild?.channels
      .fetch(settings.messageReportChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
    if (!channel || channel.type !== ChannelType.GuildText) {
      await i.reply({
        content:
          "Your report was not sent! The channel set by server moderation could not be found.",
        ephemeral: true,
      });
      return;
    }

    if (
      !i.guild?.members.me
        ?.permissionsIn(channel)
        .has(PermissionsBitField.Flags.SendMessages)
    ) {
      await i.reply({
        content:
          "Your report was not sent! I have been restricted from sending in the report channel.",
        ephemeral: true,
      });
      return;
    }

    const reportId = createHash("sha256")
      .update(randomBytes(256))
      .digest("base64");

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
          value: `${message.author.tag} (${message.author.id})`,
        },
        { name: "Message ID", value: message.id },
        { name: "Report ID", value: reportId }
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
      })
    );

    const ignActionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder({
        customId: "msg_report_ignore",
        emoji: "❎",
        label: "Ignore",
        style: ButtonStyle.Secondary,
      })
    );

    await SendLog(
      settings.messageReportChannelWebhook,
      embed,
      i.guild,
      "messageReportChannelWebhook",
      [actionRow1, ignActionRow]
    );

    await reportStore.insertOne({
      reportId,
      message: {
        content: message.content,
        id: message.id,
        author: message.author.id,
      },
      reporter: {
        id: i.user.id,
        tag: i.user.tag,
      },
      created: Date.now(),
    });
    await i.reply({
      content: `Report sent! For reference, your report ID is \`${reportId}\``,
      ephemeral: true,
    });
  },
};
