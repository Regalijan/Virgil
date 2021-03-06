module.exports = {
  name: 'pause',
  properName: 'Pause',
  description: 'Pauses audio',
  guildOnly: true,
  async execute (message) {
    const { dispatcher } = require('./PlayCommand')
    if (!dispatcher) return message.channel.send('Nothing currently playing.')
    if (!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.send('You do not have the permissions required to pause the player.')
    dispatcher.pause()
    return message.channel.send('Player is paused.')
  }
}
