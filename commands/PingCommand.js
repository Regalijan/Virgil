const beginningTS = Date.now()
const { client } = require('../index')
const db = require('../database')

module.exports = {
  name: 'ping',
  description: 'Pong',
  async execute (message) {
    const ping = await message.channel.send(':bulb: Checking...')
    await db.query('SELECT * FROM core_settings WHERE guild_id = $1', [message.guild.id])
    ping.edit(`:ping_pong: WebSocket: ${client.ws.ping}ms\nMessage Latency: ${ping.createdTimestamp - message.createdTimestamp}ms\nRound Trip: ${Date.now() - beginningTS}`)
  }
}
