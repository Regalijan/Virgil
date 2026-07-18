import { EmbedBuilder, ThreadChannel } from "discord.js";
import db from "../mongo";
import Logger from "../logger";
import SendLog from "../send_log";

const mongo = db.db("bot");

module.exports = async function (thread: ThreadChannel) {
  const ignoreData = await mongo
    .collection("ignored")
    .findOne({
      channel: { $in: [thread.parent?.id, thread.parent?.parent?.id] },
      log: { $in: ["thread_delete", null] },
    })
    .catch(Logger);
  if (ignoreData) return;

  const logChannel = await mongo
    .collection("log_channels")
    .findOne(
      { guild: thread.guildId, type: "thread_delete" },
      { projection: { webhook: 1 } },
    );

  if (!logChannel) return;
  const embed = new EmbedBuilder()
    .setDescription(`Thread ${thread.name} deleted.`)
    .setFooter({ text: `Thread ${thread.id}` })
    .setColor([255, 0, 0]);
  await SendLog(logChannel.webhook, embed, thread.guild, "thread_delete");
};
