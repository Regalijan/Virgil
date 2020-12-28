const { client } = require('../index')
const { dispatcher } = require('./PlayCommand')

module.exports = {
  name: 'leave',
  description: 'Leaves current voice channel',
  guildOnly: true,
  execute (message) {
    if (!message.guild.me.voice) {
      return message.channel.send('I\'m not in a voice channel you noob.')
    }
    if (dispatcher) {
      dispatcher.destroy()
    }
    message.guild.voice.channel.leave()
  }
}
