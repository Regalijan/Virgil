import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import redis from "../redis";
import mongo from "../mongo";

export = {
  name: "ping",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const redisBefore = Date.now();
    await redis.ping();
    const redisAfter = Date.now();
    const db = mongo.db("bot").collection("settings");
    const mongoBefore = Date.now();
    await db.findOne({ server: i.guildId });
    const mongoAfter = Date.now();
    const embed = new EmbedBuilder().setDescription("Latency").addFields(
      { name: "Database (MongoDB)", value: `${mongoAfter - mongoBefore}ms` },
      { name: "Cache (Redis)", value: `${redisAfter - redisBefore}ms` },
      { name: "Gateway", value: `${i.client.ws.ping}ms` },
      {
        name: "Command Processing",
        value: `${Date.now() - redisBefore}ms`,
      }
    );
    const member = await i.guild?.members
      .fetch(i.user.id)
      .catch((e) => console.error(e));
    if (member) embed.setColor(member.displayColor);
    await i.reply({ embeds: [embed] });
  },
};
