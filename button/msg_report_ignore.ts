import { ButtonInteraction, MessageEmbed } from "discord.js";
import mongo from "../mongo";
const reportStore = mongo.db("bot").collection("reports");
const settingsStore = mongo.db("bot").collection("settings");

export = {
  name: "msg_report_ignore",
  permissions: ["MANAGE_MESSAGES"],
  async exec(i: ButtonInteraction): Promise<void> {
    const associatedReport = await reportStore.findOne({
      reportEmbedId: i.message.id,
    });
    if (!associatedReport) {
      return await i.reply({
        content: "The report could not be found! Was it already acted upon?",
        ephemeral: true,
      });
    }
    if (!i.guild?.me?.permissionsIn(i.channelId).has("MANAGE_MESSAGES")) {
      return await i.reply({
        content:
          "I do not have permission to manage messages in this channel! Please allow me to delete messages so reports can marked as resolved.",
        ephemeral: true,
      });
    }
    await reportStore.deleteOne({
      reportEmbedId: i.message.id,
    });
    const reportMessage = await i.channel?.messages.fetch(i.message.id);
    if (
      reportMessage &&
      i.guild.me.permissionsIn(i.channelId).has("MANAGE_MESSAGES")
    ) {
      await reportMessage.delete();
    }
    await i.reply({
      content: "Report ignored!",
      ephemeral: true,
    });

    const settings = await settingsStore.findOne({ guild: i.guildId });
    if (!settings?.messageReportActionLogChannel) return;
    const channel = await i.guild?.channels.fetch(
      settings.messageReportActionLogChannel
    );
    if (
      channel?.type !== "GUILD_TEXT" ||
      !channel?.permissionsFor(i.guild.me).has("SEND_MESSAGES")
    )
      return;

    const logEmbed = new MessageEmbed()
      .setAuthor(i.user.tag, i.user.displayAvatarURL({ dynamic: true }))
      .setTitle("Report Ignored")
      .setDescription(
        `Report ${associatedReport.reportId} was ignored by <@${i.user.id}>`
      )
      .addField(
        "Reporter",
        `<@${associatedReport.reporter.id}> (${associatedReport.reporter.id})`
      )
      .addField("Reported Content", associatedReport.message.content);

    await channel.send({ embeds: [logEmbed] });
  },
};
