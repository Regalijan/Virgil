import { config as dotenv } from "dotenv";
import { readdirSync } from "fs";
import { join } from "path";
import { Client, ShardClientUtil } from "discord.js";
import Sentry from "./sentry";
import db from "./mongo";

db.connect().then(() => {});
dotenv();

const events: Map<string, any> = new Map();

const bot = new Client({
  http: {
    version: 10,
  },
  intents: [
    "GUILDS",
    "GUILD_BANS",
    "GUILD_INTEGRATIONS",
    "GUILD_MEMBERS",
    "GUILD_MESSAGES",
    "GUILD_VOICE_STATES",
    "GUILD_WEBHOOKS",
    1 << 15, // Message content
  ],
  ws: {
    // @ts-expect-error
    version: 10,
  },
});

function loadEvents() {
  if (process.env.ENABLEDEBUG)
    bot.on("debug", function (m) {
      console.log(m);
    });
  for (const file of readdirSync(join(__dirname, "events")).filter((f) =>
    f.endsWith(".js")
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

loadEvents();

bot.login().catch((e) => {
  process.env.DSN ? Sentry.captureException(e) : console.error(e);
  process.exit();
});

const mongo = db.db("bot");

setInterval(async function (): Promise<void> {
  try {
    const bans = await mongo
      .collection("bans")
      .find({ unban: { $lte: Date.now() } })
      .toArray();
    for (const ban of bans) {
      const shard = ShardClientUtil.shardIdForGuildId(
        ban.server,
        bot.shard?.count ?? 1
      );
      await bot.shard?.broadcastEval(
        async (c) => {
          const server = await c.guilds.fetch(ban.server).catch(() => {});
          if (!server?.me?.permissions.has("BAN_MEMBERS")) return;
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
        { shard: shard }
      );
    }
  } catch (e) {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
    return;
  }
  try {
    await mongo
      .collection("reports")
      .updateMany(
        { created: { $lte: Date.now() - 2592000000 } },
        { $set: { "message.content": "[ Content Deleted ]" } }
      );
  } catch (e) {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  }
}, 30000);

process.on("message", async function ({ code, data }) {
  const $set: { [k: string]: any } = {};
  switch (code) {
    case 1:
      bot.removeAllListeners();
      events.clear();
      loadEvents();
      break;
    case 3:
      for (const [key, value] of Object.entries(data.settings)) {
        $set[key] = value;
      }
      await mongo
        .collection("settings")
        .updateOne({ guild: data.guild }, { $set });
      break;
    case 4:
      $set[data.key] = data.value;
      await mongo
        .collection("settings")
        .updateOne({ guild: data.guild }, { $set });
      break;
    default:
      break;
  }
});
