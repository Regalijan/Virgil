import {
  ButtonInteraction,
  EmbedBuilder,
  MessageFlagsBitField,
  PermissionsBitField,
} from "discord.js";
import mongo from "../mongo";
import SendLog from "../send_log";
const reportStore = mongo.db("bot").collection("reports");
const settingsStore = mongo.db("bot").collection("settings");

export = {
  name: "msg_report_ban",
  async exec(i: ButtonInteraction): Promise<void> {
    const associatedReport = await reportStore.findOne({
      reportEmbedId: i.message.id,
    });
    if (!associatedReport) {
      await i.reply({
        content: "The report could not be found! Was it already acted upon?",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }
    const { Flags } = PermissionsBitField;
    if (!i.guild?.members.me?.permissions.has(Flags.BanMembers)) {
      await i.reply({
        content:
          "I do not have permission to ban! Please check my permissions.",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }
    await reportStore.deleteOne({
      reportEmbedId: i.message.id,
    });
    const reportMessage = await i.channel?.messages.fetch(i.message.id);
    if (!reportMessage) {
      await i.reply({
        content: "Failed to locate message! Was it deleted?",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }
    const settings = await settingsStore.findOne({ guild: i.guildId });
    await reportMessage.author
      .send({
        content: `You have been banned from ${reportMessage.guild?.name}.${
          settings?.banMessage ? `\n\n${settings.banMessage}` : ""
        }`,
      })
      .catch(() => {});
    await reportMessage.member?.ban();
    if (
      reportMessage &&
      i.guild.members.me?.permissionsIn(i.channelId).has(Flags.ManageMessages)
    ) {
      await reportMessage.delete();
    }
    await i.reply({
      content: `${reportMessage.author.tag} banned!`,
      flags: [MessageFlagsBitField.Flags.Ephemeral],
    });
    if (!settings?.messageReportActionLogChannelWebhook) return;

    const logEmbed = new EmbedBuilder()
      .setAuthor({
        name: i.user.tag,
        iconURL: i.user.displayAvatarURL(),
      })
      .setTitle("Report Resolved (Ban)")
      .setDescription(
        `Report ${associatedReport.reportId} was resolved by <@${i.user.id}>`,
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
