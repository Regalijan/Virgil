import { config as dotenv } from "dotenv";
import { readdirSync } from "fs";
import { join } from "path";
import {
  ActivityType,
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ShardClientUtil,
} from "discord.js";
import Logger from "./logger";
import db from "./mongo";
import custom_statuses from "./custom_statuses.json";

db.connect().then(() => {});
dotenv();

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

async function logDebug(message: any) {
  console.log(`SHARD ${bot.shard?.ids[0]}:\n${message}`);
}

loadEvents();

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
    const bans = await mongo
      .collection("bans")
      .find({ unban: { $lte: Date.now() } })
      .toArray();
    for (const ban of bans) {
      const shard = ShardClientUtil.shardIdForGuildId(
        ban.server,
        bot.shard?.count ?? 1,
      );
      await bot.shard?.broadcastEval(
        async (c) => {
          const server = await c.guilds.fetch(ban.server).catch(() => {});
          if (
            !server?.members?.me?.permissions?.has(
              PermissionsBitField.Flags.BanMembers,
            )
          )
            return;
          const member = await server.bans.fetch(ban.user).catch(() => {});
          if (!member) return;
          try {
            await server.bans.remove(member.user.id, "Temporary ban expired.");
            await mongo
              .collection("bans")
              .findOneAndDelete({ user: member.user.id });
          } catch (e) {
            console.error(e);
          }
        },
        { shard: shard },
      );
    }
  } catch (e) {
    Logger(e);
    return;
  }
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
