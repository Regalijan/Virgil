import {
  ActionRowBuilder,
  DiscordAPIError,
  EmbedBuilder,
  Guild,
} from "discord.js";
import mongo from "./mongo";

const settings = mongo.db("bot").collection("settings");

export default async function (
  url: string,
  embed: EmbedBuilder,
  guild: Guild,
  settingName: string,
  actionRows?: ActionRowBuilder[],
): Promise<void> {
  const webhookIdArr = url.match(/\d{17,19}/);
  if (!webhookIdArr) return;
  const webhookData = await guild.client
    .fetchWebhook(
      webhookIdArr[0],
      url.replace(
        /https:\/\/discord\.com\/api\/?v?\d{0,2}?\/webhooks\/\d{16,19}\//,
        "",
      ),
    )
    .catch((e: DiscordAPIError) => e);
  if (webhookData instanceof DiscordAPIError) {
    if (webhookData.status === 404) {
      const $unset: any = {};
      $unset[settingName] = "";
      $unset[settingName.replace("Webhook", "")] = "";
      await settings.updateOne({ guild: guild.id }, { $unset });
    }
    return;
  }
  const sendOpts: {
    avatarURL?: string;
    components?: ActionRowBuilder[];
    embeds: EmbedBuilder[];
  } = {
    avatarURL: guild.client.user?.displayAvatarURL(),
    embeds: [embed],
  };

  if (actionRows) sendOpts.components = actionRows;

  await webhookData.send(sendOpts as { [k: string]: any }).catch(console.error);
}
