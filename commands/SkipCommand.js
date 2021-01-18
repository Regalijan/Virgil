module.exports = {
  name: 'skip',
  description: 'Skips current track.',
  guildOnly: true,
  async execute (message) {
    const db = require('../database')
    const player = require('./PlayCommand')
    if (!player.dispatcher) return message.channel.send('Nothing currently playing.')
    const queue = await db.query(`SELECT * FROM music_queue WHERE guild = ${message.guild.id};`).catch(e => {
      console.error(e)
      return message.channel.send('Could not skip track!')
    })
    if (!message.member.hasPermission('MANAGE_MESSAGES') && message.author.id !== queue.rows[0].requester.toString()) return message.channel.send('You do not have permission to run this command.')
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
