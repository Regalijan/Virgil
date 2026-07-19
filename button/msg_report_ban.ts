import {
  ButtonInteraction,
  DiscordAPIError,
  EmbedBuilder,
  MessageFlagsBitField,
  PermissionsBitField,
} from "discord.js";
import mongo from "../mongo.js";
import SendLog from "../send_log.js";
import deleteMessage from "../webhook_delete.js";
import { ObjectId } from "mongodb";
const logsStore = mongo.db("bot").collection("log_channels");
const reportStore = mongo.db("bot").collection("reports");

export const name = "msg_report_ban";

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

  const { Flags } = PermissionsBitField;
  if (!i.guild?.members.me?.permissions.has(Flags.BanMembers)) {
    await i.reply({
      content: "I do not have permission to ban! Please check my permissions.",
      flags: [MessageFlagsBitField.Flags.Ephemeral],
    });
    return;
  }

  const fetchedChannel = await i.guild.channels
    .fetch(associatedReport.message.channel)
    .catch(() => {});

  if (!fetchedChannel) {
    await i.reply({
      content: "Failed to retrieve channel.",
      flags: [MessageFlagsBitField.Flags.Ephemeral],
    });
    return;
  }

  if (!fetchedChannel.isTextBased()) {
    await i.reply({
      content: "Channel is not text-based, how did you do that?",
      flags: [MessageFlagsBitField.Flags.Ephemeral],
    });
    return;
  }

  const reportMessage = await fetchedChannel.messages
    .fetch(associatedReport.message.id)
    .catch(() => {});

  if (!reportMessage) {
    await i.reply({
      content: "Failed to locate message! Was it deleted?",
      flags: [MessageFlagsBitField.Flags.Ephemeral],
    });
    return;
  }

  if (!reportMessage.deletable) {
    await i.reply({
      content: "Cannot delete that message, check if I have permission to.",
      flags: [MessageFlagsBitField.Flags.Ephemeral],
    });
    return;
  }

  try {
    await reportMessage.delete();
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

  const actionChannel = await logsStore.findOne({
    guild: i.guildId,
    type: "message_reports",
  });
  const banMessageSettings = await mongo
    .db("bot")
    .collection("ban_messages")
    .findOne({ guild: i.guildId });
  await reportMessage.author
    .send({
      content: `You have been banned from ${reportMessage.guild?.name}.${
        banMessageSettings ? `\n\n${banMessageSettings.message_content}` : ""
      }`,
    })
    .catch(() => {});
  await reportMessage.member?.ban();
  await i.reply({
    content: `${reportMessage.author.tag} banned!`,
    flags: [MessageFlagsBitField.Flags.Ephemeral],
  });

  try {
    await deleteMessage(actionChannel?.webhook, i.guild, i.message.id);
  } catch {}

  await reportStore.deleteOne({
    _id: objId,
  });

  if (actionChannel?.webhook) {
    try {
      await deleteMessage(actionChannel.webhook, i.guild, i.message.id);
    } catch {}
  }

  const actionLogChannel = await logsStore.findOne({
    guild: i.guildId,
    type: "message_report_actions",
  });

  if (!actionLogChannel) return;

  const logEmbed = new EmbedBuilder()
    .setAuthor({
      name: i.user.tag,
      iconURL: i.user.displayAvatarURL(),
    })
    .setTitle("Report Resolved (Ban)")
    .setDescription(
      `Report ${associatedReport._id} was resolved by <@${i.user.id}>`,
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
      {
        name: "User Banned",
        value: `${associatedReport.message.author}`,
      },
    );

  await SendLog(
    actionLogChannel.webhook,
    logEmbed,
    i.guild,
    "messageReportActionLogChannelWebhook",
  );
}
