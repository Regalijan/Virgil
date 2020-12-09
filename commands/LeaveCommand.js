const { client } = require('../index')
const { dispatcher } = require('./PlayCommand')

module.exports = {
  name: 'leave',
  description: 'Leaves current voice channel',
  guildOnly: true,
  execute (message) {
    if (!client.member.voice.channel) {
      return message.channel.send('I\'m not in a voice channel you noob.')
    }
    if (dispatcher) {
      dispatcher.destroy()
    }
    bot.client.member.voice.channel.leave()
  }
}
