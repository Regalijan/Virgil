module.exports = {
  name: 'appealban',
  properName: 'AppealBan',
  description: 'Bans a user from the appeal form',
  guildOnly: true,
  async execute (message, args) {
    const db = require('../database')
    const useroverridecheck = await db.query('SELECT * FROM appeals_managers WHERE type = \'user\' AND guild = $1 AND id = $2;', [message.guild.id, message.author.id])
    const roleoverridecheck = await db.query('SELECT * FROM appeals_managers WHERE guild = $1 AND type = \'role\';', [message.guild.id])
    const overrides = []
    roleoverridecheck.rows.forEach(row => overrides.push(row.id.toString()))
    if (useroverridecheck.rowCount === 0 && !message.member.roles.cache.some(role => overrides.includes(role.id)) && !message.member.hasPermission('ADMINISTRATOR')) return
    if (!args[0]) return message.channel.send('You did not specify a user!')
    try {
      const user = await db.query('SELECT * FROM auth WHERE discord_id = $1;', [args[0]])
      if (user.rowCount === 0) {
        await db.query('INSERT INTO auth(discord_id,email,username,discriminator,blocked) VALUES($1,$2,$3,$4,$5);', [args[0], 'removed', 'unknown', 0, true])
      }
      await db.query('UPDATE auth SET blocked = true WHERE discord_id = $1;', [args[0]])
      message.channel.send('User has been banned from the form!')
    } catch (e) {
      console.error(e)
      return message.channel.send(`I could not complete the request! ${e}`)
    }
  }
}
