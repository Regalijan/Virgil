import { Guild } from "discord.js";
import db from "../mongo";
import Sentry from "../sentry";

const mongo = db.db("bot");

module.exports = async function (guild: Guild) {
  const existingSettings = await mongo
    .collection("settings")
    .findOne({ guild: guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (typeof existingSettings === "undefined" || existingSettings) return;
  await mongo
    .collection("settings")
    .insertOne({ guild: guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
};
