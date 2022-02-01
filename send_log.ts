import axios from "axios";
import { MessageEmbed } from "discord.js";
import mongo from "./mongo";

const settings = mongo.db("bot").collection("settings");

export default async function (
  url: string,
  embed: MessageEmbed,
  guild: string,
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
    await settings.updateOne({ guild: guild }, { $unset });
  }
}
