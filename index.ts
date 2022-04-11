import { config as dotenv } from "dotenv";
import { ShardingManager } from "discord.js";
import { join } from "path";
import WebSocket from "ws";
import axios from "axios";
import { execSync } from "child_process";

dotenv();

async function getGatewayData() {
  if (!process.env.DISCORDTOKEN)
    return console.error("No token was detected in the environment!");
  const request = await axios("https://discord.com/api/v10/gateway/bot", {
    headers: {
      authorization: `Bot ${process.env.DISCORDTOKEN}`,
    },
  });
  return request.data;
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
  if (process.env.BROKER_TOKEN) {
    /*
      WS Event Codes:
        0: Authentication
        1: Update all interactions
        2: Update core files (shard.ts, and dependencies)
        3: Update server settings
        4: Retrieve server settings
     */
    const broker = new WebSocket(
      process.env.BROKER_URL ?? "wss://broker.virgil.gg"
    );
    broker.on("open", function () {
      broker.send(
        JSON.stringify({
          code: 0, // Authenticate
          data: {
            token: process.env.BROKER_TOKEN,
          },
        })
      );
    });
    broker.on("message", async function (message) {
      const { code, data, shard } = JSON.parse(message.toString());
      if (typeof shard === "number" && [1, 2].includes(shard))
        try {
          execSync("git pull && npx tsc", { cwd: join(__dirname, "..") });
        } catch (e) {
          console.error(e);
        }
      switch (code) {
        case 1:
          typeof shard === "number"
            ? await shardMgr.shards.get(shard)?.send({ code, data })
            : await shardMgr.broadcast({ code, data });
          break;
        case 2:
          const respawnMaxConcurrency = (await getGatewayData())
            .session_start_limit.max_concurrency;
          shardMgr.shards.each(async (shard) => {
            const delay = Math.ceil(5000 / respawnMaxConcurrency);
            await shard.respawn({ delay }); // Sure we could kill all of them at once, but spawning all of them again after can result in some servers facing extended downtime depending on the number of shards.
          });
      }
    });
  }
})();
