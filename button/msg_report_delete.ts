import {
  ButtonInteraction,
  DiscordAPIError,
  EmbedBuilder,
  Message,
  MessageFlagsBitField,
} from "discord.js";
import { ObjectId } from "mongodb";
import mongo from "../mongo";
import deleteMessage from "../webhook_delete";
import SendLog from "../send_log";

const reportStore = mongo.db("bot").collection("reports");
const settingsStore = mongo.db("bot").collection("settings");

export = {
  name: "msg_report_delete",
  async exec(i: ButtonInteraction) {
    if (!i.guild || !i.message.embeds[0].fields) return;

    const objectId = new ObjectId(i.message.embeds[0].fields[3].value);

    const associatedReport = await reportStore.findOne({
      _id: objectId,
    });

    if (!associatedReport) {
      await i.reply({
        content: "The report could not be found! Was it already acted upon?",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    const fetchedChannel = await i.guild.channels
      .fetch(i.message.embeds[0].fields[2].value)
      .catch(() => {});

    if (!fetchedChannel) {
      await i.reply({
        content:
          "Failed to locate the channel message is located in. If this keeps happening, please ignore the report.",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    if (!fetchedChannel.isTextBased()) {
      await i.reply({
        content: "The channel is not text-based, how did this happen?",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    const message = fetchedChannel.messages
      .fetch(i.message.embeds[0].fields[1].value)
      .catch(() => {});

    if (!(message instanceof Message)) {
      await i.reply({
        content:
          "Failed to locate message. If this keeps happening, please ignore the report.",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    if (!message.deletable) {
      await i.reply({
        content:
          "I cannot delete the message. Please verify I have permission to do so.",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    const settings = await settingsStore.findOne({ guild: i.guildId });

    try {
      await deleteMessage(
        settings?.messageReportChannelWebhook,
        i.guild,
        i.message.id,
      );
    } catch (e) {
      let msg = "An unknown error has occurred.";

      if (e instanceof DiscordAPIError) {
        if (e.status.toString().startsWith("5"))
          msg = "Discord is having a service outage, please try again later.";

        if (e.status === 404)
          msg = "Message no longer exists. Please ignore this report.";
        if (e.status === 403)
          msg = "I do not have permission to delete this message.";
      }

      await i.reply({
        content: msg,
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    await reportStore.deleteOne({
      _id: objectId,
    });

    await i.reply({
      content: "Message deleted!",
      flags: [MessageFlagsBitField.Flags.Ephemeral],
    });

    if (!settings?.messageReportActionLogChannelWebhook) return;

    const logEmbed = new EmbedBuilder()
      .setAuthor({
        name: i.user.tag,
        iconURL: i.user.displayAvatarURL(),
      })
      .setTitle("Report Resolved (Message Deleted)")
      .setDescription(
        `User ${associatedReport.reportId} was ignored by <@${i.user.id}>`,
      )
      .addFields(
        {
          name: "Reporter",
          value: `<@${associatedReport.reporter.id}> (${associatedReport.reporter.id})`,
        },
        {
          name: "Reported Content",
          value: associatedReport.message.content,
        },
      );

    await SendLog(
      settings.messageReportActionLogChannelWebhook,
      logEmbed,
      i.guild,
      "messageReportActionLogChannelWebhook",
    );
  },
};
