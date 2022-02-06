import { DiscordAPIError, Guild, MessageEmbed } from "discord.js";
import mongo from "./mongo";

const settings = mongo.db("bot").collection("settings");
const ignoredDB = mongo.db("bot").collection("ignored");

export default async function (
  url: string,
  embed: MessageEmbed,
  guild: Guild,
  settingName: string
): Promise<void> {
  const webhookIdArr = url.match(/\d{17,19}/);
  if (!webhookIdArr) return;
  const webhookData = await guild.client
    .fetchWebhook(
      webhookIdArr[0],
      url.replace(
        /https:\/\/discord\.com\/api\/?v?\d{0,2}?\/webhooks\/\d{16,19}\//,
        ""
      )
    )
    .catch((e) => e);
  if (webhookData instanceof DiscordAPIError) {
    if (webhookData.httpStatus === 404) {
      const $unset: any = {};
      $unset[settingName] = "";
      $unset[settingName.replace("Webhook", "")] = "";
      await settings.updateOne({ guild: guild.id }, { $unset });
    }
    return;
  }
  const isIgnoredData = await ignoredDB.findOne({
    channel: webhookData.channelId,
    log: settingName.replace("LogChannelWebhook", ""),
  })
  if (isIgnoredData) return;
  await webhookData.send({ avatarURL: guild.client.user?.displayAvatarURL(), embeds: [embed.toJSON()] }).catch(console.error);
}
