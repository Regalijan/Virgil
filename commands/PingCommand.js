const { client } = require('../index')

module.exports = {
  name: 'ping',
  description: 'Pong',
  async execute (message) {
    const ping = await message.channel.send(':bulb: Checking...')
    ping.edit(`:ping_pong: WebSocket: ${client.ws.ping}ms, Total: ${ping.createdTimestamp - message.createdTimestamp}ms`)
  }
}
