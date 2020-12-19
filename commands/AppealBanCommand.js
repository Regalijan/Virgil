const config = require('../config.json')
const db = require('../database')

module.exports = {
  name: 'appealban',
  description: 'Bans a user from the appeal form',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.roles.cache.some(role => config.appealsManagerRole.includes(role.id))) {
      return message.channel.send('You do not have permission to run this command!')
    }
    try {
      const user = await db.query('SELECT * FROM auth WHERE discord_id = $1;', [args[0]])
      if (!user) {
        return message.channel.send('This user could not be found!')
      }
      await db.query('UPDATE auth SET blocked = true WHERE discord_id = $1;', [args[0]])
      message.channel.send('User has been banned from the form!')
    } catch (e) {
      console.error(e)
      return message.channel.send(`I could not complete the request! ${e}`)
    }
  }
}
