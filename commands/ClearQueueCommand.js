const db = require('../database')

module.exports = {
  name: 'clearqueue',
  description: 'Clears music queue',
  guildOnly: true,
  async execute (message) {
    if (!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.send('You cannot run this command!')
    db.query(`DELETE FROM music_queue WHERE guild = ${message.guild.id};`).catch(e => {
      console.error(e.stack)
      return message.channel.send(e)
    })
    return message.channel.send('Cleared music queue!')
  }
}
