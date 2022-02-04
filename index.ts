import { config as dotenv } from "dotenv";
import { ShardingManager } from "discord.js";
import { join } from "path";
import axios from "axios";

dotenv();

(async function () {
  if (!process.env.DISCORDTOKEN)
    return console.error("No token was detected in the environment!");
  const gatewayRequest = await axios("https://discord.com/api/v9/gateway/bot", {
    headers: {
      authorization: `Bot ${process.env.DISCORDTOKEN}`,
    },
  });
  if (gatewayRequest.status !== 200)
    throw new Error("Gateway information request failed!");
  const shardCount = gatewayRequest.data.shards;
  const shardMgr = new ShardingManager(join(__dirname, "shard.js"), {
    token: process.env.DISCORDTOKEN,
    totalShards: shardCount,
  });
  shardMgr.on("shardCreate", function (shard) {
    console.log(`Launching shard ${shard.id + 1} of ${shardMgr.totalShards}.`);
  });
  const maxConcurrency =
    gatewayRequest.data.session_start_limit.max_concurrency;
  let spawnBucketStart = Date.now();
  for (let i = 0; i < shardCount; i++) {
    if (
      i !== 0 &&
      i % maxConcurrency === 0 &&
      Date.now() - 5000 < spawnBucketStart
    ) {
      await new Promise((r) => setTimeout(r, Date.now() - spawnBucketStart));
      spawnBucketStart = Date.now();
    }
    await shardMgr.spawn({ amount: 1, delay: 0 });
  }
})();
