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
  const data: { [k: string]: any } = {
    embeds: [embed.toJSON()],
  };
  if (guild.me) {
    data.avatar_url = guild.me.displayAvatarURL();
    data.username = guild.me.displayName;
  }
  const logPostReq = await axios(url, {
    method: "POST",
    validateStatus: () => true,
    data,
  }).catch(console.error);
  if (logPostReq?.status === 404) {
    const $unset: any = {};
    $unset[settingName] = "";
    $unset[settingName.replace("Webhook", "")] = "";
    await settings.updateOne({ guild: guild.id }, { $unset });
  }
}
