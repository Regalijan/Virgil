import { Client } from "discord.js";

module.exports = async function (client: Client) {
  console.log(
    `Shard ${client.shard?.ids[0]} ready with ${client.guilds.cache.size} guilds.`,
  );
};
