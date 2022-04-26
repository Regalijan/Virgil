import {
  ContextMenuInteraction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js";
import { createHash, randomBytes } from "crypto";
import mongo from "../mongo";
import SendLog from "../send_log";
import Sentry from "../sentry";
const settingsStore = mongo.db("bot").collection("settings");
const reportStore = mongo.db("bot").collection("reports");

export = {
  name: "Report Message to Server Mods",
  permissions: [],
  async exec(i: ContextMenuInteraction): Promise<void> {
    if (i.targetType === "USER")
      throw Error(
        "<ContextMenuInteraction>.targetType equal to USER but command is in a message context."
      );
    const message = await i.channel?.messages.fetch(i.targetId).catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
    if (!message)
      return await i.reply({
        content: "An error occurred locating the message! Was it deleted?",
        ephemeral: true,
      });
    const settings = await settingsStore.findOne({ guild: i.guildId });
    if (!settings?.messageReportChannel)
      return await i.reply({
        content: "Message reporting is disabled in the server.",
        ephemeral: true,
      });
    const channel = await i.guild?.channels
      .fetch(settings.messageReportChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
    if (!channel || channel.type !== "GUILD_TEXT")
      return await i.reply({
        content:
          "Your report was not sent! The channel set by server moderation could not be found.",
        ephemeral: true,
      });
    if (!i.guild?.me?.permissionsIn(channel).has("SEND_MESSAGES"))
      return await i.reply({
        content:
          "Your report was not sent! I have been restricted from sending in the report channel.",
        ephemeral: true,
      });
    const reportId = createHash("sha256")
      .update(randomBytes(256))
      .digest("base64");

    const embed = new MessageEmbed()
      .setAuthor({
        name: i.user.tag,
        iconURL: i.user.displayAvatarURL({ dynamic: true }),
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

    const actionRow1 = new MessageActionRow({
      components: [
        new MessageButton({
          customId: "msg_report_ban",
          emoji: "🔨",
          label: "Ban",
          style: "DANGER",
          type: "BUTTON",
        }),
        new MessageButton({
          customId: "msg_report_delete",
          emoji: "❌",
          label: "Delete",
          style: "SUCCESS",
          type: "BUTTON",
        }),
        new MessageButton({
          customId: "msg_report_kick",
          emoji: "👢",
          label: "Kick",
          style: "DANGER",
          type: "BUTTON",
        }),
        new MessageButton({
          customId: "msg_report_mute",
          emoji: "🔇",
          label: "Mute",
          style: "DANGER",
          type: "BUTTON",
        }),
        new MessageButton({
          customId: "msg_report_warn",
          emoji: "⚠",
          label: "Warn",
          style: "PRIMARY",
          type: "BUTTON",
        }),
      ],
    });

    const ignActionRow = new MessageActionRow({
      components: [
        new MessageButton({
          customId: "msg_report_ignore",
          emoji: "❎",
          label: "Ignore",
          style: "SECONDARY",
          type: "BUTTON",
        }),
      ],
    });

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
