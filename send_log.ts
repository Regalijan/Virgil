import { DiscordAPIError, Guild, MessageEmbed } from "discord.js";
import mongo from "./mongo";

const settings = mongo.db("bot").collection("settings");

export default async function (
  url: string,
  embed: MessageEmbed,
  guild: Guild,
  settingName: string
): Promise<void> {
  const data: { [k: string]: any } = {
    avatar_url: guild.me?.displayAvatarURL(),
    embeds: [embed.toJSON()],
  };
  if (guild.me) {
    data.avatar_url = guild.me.displayAvatarURL();
    data.username = guild.me.displayName;
  }
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
  await webhookData.send(data).catch(console.error);
}
