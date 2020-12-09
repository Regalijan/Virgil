const db = require('../database')

module.exports = {
  name: 'skip',
  description: 'Skips current track.',
  guildOnly: true,
  async execute (message) {
    const player = require('./PlayCommand')
    if (!player.dispatcher) return message.channel.send('Nothing currently playing.')
    if (!message.member.hasPermission('MANAGE_GUILD')) return message.channel.send('You do not have permission to run this command.')
    const queue = await db.query(`SELECT * FROM music_queue WHERE guild = ${message.guild.id};`).catch(e => {
      console.error(e)
      return message.channel.send('Could not skip track!')
    })
    if (!queue.rows[1]) return message.channel.send('Nothing to skip.')
    await db.query('DELETE FROM music_queue WHERE guild = $1 AND time = $2;', [message.guild.id, queue.rows[0].time]).catch(e => {
      console.error(e)
      return message.channel.send('Could not skip track!')
    })
    try {
      player.dispatcher.destroy()
      player.execute(message)
    } catch (e) {
      console.error(e)
    }
  }
}
