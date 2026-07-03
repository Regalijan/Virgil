import { config as dotenv } from "dotenv";

dotenv();

import { readdirSync } from "fs";
import { join } from "path";
import { ActivityType, Client, GatewayIntentBits } from "discord.js";
import Logger from "./logger";
import db from "./mongo";
import agenda from "./agenda";
import custom_statuses from "./custom_statuses.json";

db.connect().then(() => {});

const events: Map<string, any> = new Map();

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.MessageContent,
  ],
});

function loadEvents() {
  if (process.env.ENABLEDEBUG)
    bot.on("debug", function (m) {
      console.log(m);
    });
  for (const file of readdirSync(join(__dirname, "events")).filter((f) =>
    f.endsWith(".js"),
  )) {
    const requiredEvent = require(`./events/${file}`);
    events.set(file.replace(".js", ""), requiredEvent);
  }

  events.forEach((_value, key) => {
    const event = events.get(key);
    bot.on(key, async (...args: any[]) => {
      await event(...args);
    });
  });
}

function loadJobs() {
  for (const file of readdirSync(join(__dirname, "jobs")).filter((f) =>
    f.endsWith(".js"),
  )) {
    const requiredJob = require(`./jobs/${file}`);
    agenda.define(
      file,
      (job) => requiredJob.job(job, bot),
      requiredJob.options ?? undefined,
    );
  }
}

async function logDebug(message: any) {
  console.log(`SHARD ${bot.shard?.ids[0]}:\n${message}`);
}

loadEvents();
loadJobs();

bot.login().catch((e) => {
  Logger(e);
  process.exit();
});

process.on("enableDebug", async function () {
  bot.on("debug", logDebug);
});

process.on("disableDebug", async function () {
  bot.off("debug", logDebug);
});

agenda.start().then(() => {});

const mongo = db.db("bot");

setInterval(async function (): Promise<void> {
  const selectedStatus =
    custom_statuses[Math.round(Math.random() * (custom_statuses.length - 1))];

  bot.user?.setActivity(selectedStatus, {
    shardId: bot.shard?.ids[0],
    state: selectedStatus,
    type: ActivityType.Custom,
  });
}, 120000);

setInterval(async function (): Promise<void> {
  try {
    await mongo
      .collection("reports")
      .updateMany(
        { created: { $lte: Date.now() - 2592000000 } },
        { $set: { "message.content": "[ Content Deleted ]" } },
      );
  } catch (e) {
    Logger(e);
  }
}, 30000);
