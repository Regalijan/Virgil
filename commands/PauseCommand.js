module.exports = {
  name: 'pause',
  description: 'Pauses audio',
  guildOnly: true,
  async execute (message) {
    const { dispatcher } = require('./PlayCommand')
    const serversettings = require(`../serversettings/${message.guild.id}`)
    if ((message.member.roles.cache.some(role => serversettings.moderatorRoles.includes(role.id))) || (message.member.hasPermission('MANAGE_GUILD'))) {
      dispatcher.pause()
      return message.channel.send('Player is paused.')
    }
    return message.channel.send('You do not have the permissions required to pause the player.')
  }
}
