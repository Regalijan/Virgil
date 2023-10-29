import { config as dotenv } from "dotenv";
import { ShardingManager } from "discord.js";
import { join } from "path";

if (typeof fetch === "undefined")
  console.error(
    "`fetch` is not defined. Use Node v17.5.0 or later (versions below 18 require passing the --experimental-global-fetch flag)",
  );

dotenv();

async function getGatewayData() {
  if (!process.env.DISCORDTOKEN)
    return console.error("No token was detected in the environment!");
  const request = await fetch("https://discord.com/api/v10/gateway/bot", {
    headers: {
      authorization: `Bot ${process.env.DISCORDTOKEN}`,
    },
  });

  return await request.json();
}

(async function () {
  const gatewayData = await getGatewayData();
  const shardCount = gatewayData.shards;
  const shardMgr = new ShardingManager(join(__dirname, "shard.js"), {
    token: process.env.DISCORDTOKEN,
    totalShards: shardCount,
  });

  shardMgr.on("shardCreate", function (shard) {
    console.log(`Launching shard ${shard.id + 1} of ${shardMgr.totalShards}.`);
  });

  const maxConcurrency = gatewayData.session_start_limit.max_concurrency;

  await shardMgr.spawn({ delay: Math.ceil(5000 / maxConcurrency) });

  process.on("SIGTERM", () => {
    shardMgr.shards.each((shard) => {
      shard.kill();
    });
    process.exit();
  });
})();
