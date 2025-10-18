import {
  ButtonInteraction,
  EmbedBuilder,
  MessageFlagsBitField,
} from "discord.js";
import mongo from "../mongo";
import DeleteMessage from "../webhook_delete";
import SendLog from "../send_log";
const reportStore = mongo.db("bot").collection("reports");
const settingsStore = mongo.db("bot").collection("settings");

export = {
  name: "msg_report_ignore",
  async exec(i: ButtonInteraction): Promise<void> {
    if (!i.guild || !i.message.embeds[0].fields) return;
    const associatedReport = await reportStore.findOne({
      "message.id": i.message.embeds[0].fields[1].value,
    });
    if (!associatedReport) {
      await i.reply({
        content: "The report could not be found! Was it already acted upon?",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }
    await reportStore.deleteOne({
      "message.id": i.message.embeds[0].fields[1].value,
    });
    const settings = await settingsStore.findOne({ guild: i.guildId });
    const reportMessage = await i.channel?.messages.fetch(i.message.id);
    if (reportMessage && settings?.messageReportChannelWebhook) {
      await DeleteMessage(
        settings.messageReportChannelWebhook,
        reportMessage.id,
        i.guild,
      );
    }
    await i.reply({
      content: "Report ignored!",
      flags: [MessageFlagsBitField.Flags.Ephemeral],
    });

    if (!settings?.messageReportActionLogChannelWebhook) return;

    const logEmbed = new EmbedBuilder()
      .setAuthor({
        name: i.user.tag,
        iconURL: i.user.displayAvatarURL(),
      })
      .setTitle("Report Ignored")
      .setDescription(
        `Report ${associatedReport.reportId} was ignored by <@${i.user.id}>`,
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
