const bot = require('../index')

module.exports = {
  name: 'leave',
  description: 'Leaves current voice channel',
  guildOnly: true,
  execute (message) {
    if (!bot.client.member.voice.channel) {
      return message.channel.send('I\'m not in a voice channel you noob.')
    }
    bot.client.member.voice.channel.leave()
  }
}
