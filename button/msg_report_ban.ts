import { ButtonInteraction, MessageEmbed } from "discord.js";
import mongo from "../mongo";
const reportStore = mongo.db("bot").collection("reports");
const settingsStore = mongo.db("bot").collection("settings");

export = {
  name: "msg_report_ban",
  permissions: ["BAN_MEMBERS", "MANAGE_MESSAGES"],
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
    if (!i.guild?.me?.permissionsIn(i.channelId).has(["MANAGE_MESSAGES"])) {
      return await i.reply({
        content:
          "I do not have permission to manage messages in this channel! Please allow me to delete messages so reports can marked as resolved.",
        ephemeral: true,
      });
    }
    if (!i.guild.me.permissions.has("BAN_MEMBERS")) {
      return await i.reply({
        content:
          "I do not have permission to ban! Please check my permissions.",
        ephemeral: true,
      });
    }
    await reportStore.deleteOne({
      reportEmbedId: i.message.id,
    });
    const reportMessage = await i.channel?.messages.fetch(i.message.id);
    if (!reportMessage)
      return await i.reply({
        content: "Failed to locate message! Was it deleted?",
        ephemeral: true,
      });
    const settings = await settingsStore.findOne({ guild: i.guildId });
    await reportMessage.author
      .send({
        content: `You have been banned from ${
          reportMessage.guild?.name
        } due to a member report.${
          settings?.banMessage ? `\n\n${settings.banMessage}` : ""
        }`,
      })
      .catch(() => {});
    await reportMessage.member?.ban();
    if (
      reportMessage &&
      i.guild.me.permissionsIn(i.channelId).has("MANAGE_MESSAGES")
    ) {
      await reportMessage.delete();
    }
    await i.reply({
      content: `${reportMessage.author.tag} banned!`,
      ephemeral: true,
    });
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
      .setTitle("Report Resolved (Ban)")
      .setDescription(
        `Report ${associatedReport.reportId} was resolved by <@${i.user.id}>`
      )
      .addField(
        "Reporter",
        `<@${associatedReport.reporter.id}> (${associatedReport.reporter.id})`
      )
      .addField("Reported Content", associatedReport.message.content);

    await channel.send({ embeds: [logEmbed] });
  },
};