import axios from "axios";
import { Guild, MessageEmbed } from "discord.js";
import mongo from "./mongo";

const settings = mongo.db("bot").collection("settings");

export default async function (
  url: string,
  embed: MessageEmbed,
  guild: Guild,
  settingName: string
): Promise<void> {
  const logPostReq = await axios(url, {
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
    validateStatus: () => true,
    data: JSON.stringify({ embeds: [embed.toJSON()] }),
  }).catch(console.error);
  if (logPostReq?.status === 404) {
    const $unset: any = {};
    $unset[settingName] = "";
    $unset[settingName.replace("Webhook", "")] = "";
    await settings.updateOne({ guild: guild.id }, { $unset });
  }
}
