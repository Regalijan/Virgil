import {
  ButtonInteraction,
  EmbedBuilder,
  MessageFlagsBitField,
} from "discord.js";
import { ObjectId } from "mongodb";
import mongo from "../mongo.js";
import deleteMessage from "../webhook_delete.js";
import SendLog from "../send_log.js";

const logsStore = mongo.db("bot").collection("log_channels");
const reportStore = mongo.db("bot").collection("reports");

export const name = "msg_report_ignore";

export async function exec(i: ButtonInteraction): Promise<void> {
  if (!i.guild || !i.message.embeds[0].fields) return;

  const objId = new ObjectId(i.message.embeds[0].fields[3].value);
  const associatedReport = await reportStore.findOne({
    _id: objId,
  });

  if (!associatedReport) {
    await i.reply({
      content: "The report could not be found! Was it already acted upon?",
      flags: [MessageFlagsBitField.Flags.Ephemeral],
    });
    return;
  }
  await reportStore.deleteOne({
    _id: objId,
  });

  const actionChannel = await logsStore.findOne({
    guild: i.guildId,
    type: "message_reports",
  });

  try {
    await deleteMessage(actionChannel?.webhook, i.guild, i.message.id);
  } catch {}

  await i.reply({
    content: "Report ignored!",
    flags: [MessageFlagsBitField.Flags.Ephemeral],
  });

  const logChannel = await logsStore.findOne({
    guild: i.guildId,
    type: "message_report_actions",
  });
  if (!logChannel) return;

  const logEmbed = new EmbedBuilder()
    .setAuthor({
      name: i.user.tag,
      iconURL: i.user.displayAvatarURL(),
    })
    .setTitle("Report Ignored")
    .setDescription(
      `Report ${associatedReport._id} was ignored by <@${i.user.id}>`,
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
    logChannel.webhook,
    logEmbed,
    i.guild,
    "messageReportActionLogChannelWebhook",
  );
}
