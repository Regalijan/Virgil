import { config as dotenv } from "dotenv";
import { ShardingManager } from "discord.js";
import { join } from "path";
import mongo from "./mongo";

dotenv();

mongo.connect();

if (!process.env.DISCORDTOKEN)
  throw Error("No token was detected in the environment!");

const shardMgr = new ShardingManager(join(__dirname, "shard.js"), {
  token: process.env.DISCORDTOKEN,
});

shardMgr.on("shardCreate", function (shard) {
  console.log(`Launching shard ${shard.id + 1} of ${shardMgr.totalShards}.`);
});

shardMgr.spawn();
