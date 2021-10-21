import { ButtonInteraction } from "discord.js";
import mongo from "../mongo";
const reportStore = mongo.db("bot").collection("reports");

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
  },
};
