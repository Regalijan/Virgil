module.exports = {
  name: 'getappeals',
  properName: 'GetAppeals',
  description: 'Retrieves all open appeals',
  guildOnly: true,
  async execute (message) {
    const db = require('../database')
    const useroverridecheck = await db.query('SELECT * FROM appeals_managers WHERE type = \'user\' AND guild = $1 AND id = $2;', [message.guild.id, message.author.id])
    const roleoverridecheck = await db.query('SELECT * FROM appeals_managers WHERE guild = $1 AND type = \'role\';', [message.guild.id])
    const overrides = []
    roleoverridecheck.rows.forEach(row => overrides.push(row.id.toString()))
    if (useroverridecheck.rowCount === 0 && !message.member.roles.cache.some(role => overrides.includes(role.id)) && !message.member.hasPermission('ADMINISTRATOR')) return
    try {
      const appeals = await db.query('SELECT appeals.discord_id, auth.username, auth.discriminator FROM appeals,auth WHERE appeals.discord_id = auth.discord_id;')
      if (appeals.rowCount === 0) return message.channel.send('There are currently no open appeals.')
      let users = ''
      for (let i = 0; i < appeals.rowCount; i++) {
        users = `${users}\n\n${appeals.rows[i].username}#${('0000' + appeals.rows[i].discriminator).slice(-4)} (${appeals.rows[i].discord_id})`
      }
      const { MessageEmbed } = require('discord.js')
      const embed = new MessageEmbed()
        .setTitle('Open Appeals')
        .setDescription(users)
        .setColor(3756250)
        .setTimestamp()
      await message.channel.send(embed)
    } catch (e) {
      console.error(e)
      return message.channel.send('An error occured while fetching appeals!')
    }
  }
}
