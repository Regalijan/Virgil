import { CommandInteraction, MessageEmbed } from 'discord.js'
import redis from '../redis'
import mongo from '../mongo'

export = {
  name: 'ping',
  permissions: [],
  interactionData: {
    name: 'ping',
    description: 'Pong!'
  },
  async exec (i: CommandInteraction): Promise<void> {
    const redisBefore = Date.now()
    await redis.ping()
    const redisAfter = Date.now()
    const db = mongo.db().collection('settings')
    const mongoBefore = Date.now()
    await db.findOne({ server: i.guildId })
    const mongoAfter = Date.now()
    const embed = new MessageEmbed()
      .setDescription('Latency')
      .addFields(
        { name: 'Database (MongoDB)', value: `${mongoAfter - mongoBefore}` },
        { name: 'Cache (Redis)', value: `${redisAfter - redisBefore}` },
        { name: 'Gateway', value: `${i.client.ws.ping}ms` },
        { name: 'Round Trip (since you ran the command)', value: `${Date.now() - i.createdTimestamp}ms` }
      )

    const member = await i.guild?.members.fetch(i.user.id).catch(e => console.error(e))
    if (member) embed.setColor(member.displayColor)
    await i.reply({ embeds: [embed] })
  }
}
