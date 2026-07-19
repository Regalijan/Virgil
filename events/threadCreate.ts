import { EmbedBuilder, ThreadChannel } from "discord.js";
import mongo from "../mongo.js";
import Logger from "../logger.js";
import SendLog from "../send_log.js";

const ignoredStore = mongo.db("bot").collection("ignored");
const logStore = mongo.db("bot").collection("log_channels");

export default async function (thread: ThreadChannel) {
  const ignoreData = await ignoredStore
    .findOne({
      channel: { $in: [thread.parent?.id, thread.parent?.parent?.id] },
      log: { $in: ["thread_create", null] },
    })
    .catch(Logger);

  if (ignoreData) return;

  const logChannel = await logStore.findOne(
    { guild: thread.guild.id, type: "thread_create" },
    { projection: { webhook: 1 } },
  );

  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setDescription(`Thread <#${thread.id}> created by <@${thread.ownerId}>`)
    .setFooter({ text: `Thread ${thread.id}` })
    .setColor([0, 255, 0]);
  await SendLog(logChannel.webhook, embed, thread.guild, "thread_create");
}
