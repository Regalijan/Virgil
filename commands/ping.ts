import { CommandInteraction, MessageEmbed } from 'discord.js'
import redis from '../redis'
import mongo from '../mongo'

export = {
  name: 'ping',
  permissions: [],
  async exec (i: CommandInteraction): Promise<void> {
    const redisBefore = Date.now()
    await redis.ping()
    const redisAfter = Date.now()
    const db = mongo.db().collection('settings')
    const mongoBefore = Date.now()
    await db.findOne({ server: i.guildId })
    const mongoAfter = Date.now()
    const embed = new MessageEmbed()
      .setColor(i.guild.members.cache.find(i => i.id === i.user.id).displayColor)
      .setDescription('Latency')
      .addFields(
        { name: 'Database (MongoDB)', value: `${mongoAfter - mongoBefore}` },
        { name: 'Cache (Redis)', value: `${redisAfter - redisBefore}` },
        { name: 'Gateway', value: `${i.client.ws.ping}ms` },
        { name: 'Round Trip (since you ran the command)', value: `${Date.now() - i.createdTimestamp}ms` }
      )

    await i.reply({ embeds: [embed] })
  }
}
