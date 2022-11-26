import { Guild } from "discord.js";
import db from "../mongo";
import Logger from "../logger";

const mongo = db.db("bot");

module.exports = async function (guild: Guild) {
  const existingSettings = await mongo
    .collection("settings")
    .findOne({ guild: guild.id })
    .catch(Logger);
  if (typeof existingSettings === "undefined" || existingSettings) return;
  await mongo
    .collection("settings")
    .insertOne({ guild: guild.id })
    .catch(Logger);
};
