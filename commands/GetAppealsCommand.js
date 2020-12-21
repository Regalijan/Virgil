const config = require('../config.json')
const db = require('../database')
const Discord = require('discord.js')

module.exports = {
  name: 'getappeals',
  description: 'Retrieves all open appeals',
  guildOnly: true,
  async execute(message) {
    if (!message.member.roles.cache.some(role => config.appealsManagerRole.includes(role.id))) {
      return message.channel.send('You do not have permission to run this command!')
    }
    try {
      const appeals = await db.query('SELECT appeals.discord_id, auth.username, auth.discriminator FROM appeals,auth WHERE appeals.discord_id = auth.discord_id;')
      if (appeals.rowCount === 0) return message.channel.send('There are currently no open appeals.')
      let users
      for (let i = 0; i < appeals.rowCount; i++) {
        users = `${users}\n\n${appeals.rows[i].username}#${('0000' + appeals.rows[i].discriminator).slice(-4)} (${appeals.rows[i].discord_id})`
      }
      const embed = new Discord.MessageEmbed()
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