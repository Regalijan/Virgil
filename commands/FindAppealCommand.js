const config = require('../config.json')
const db = require('../database')
const Discord = require('discord.js')

module.exports = {
  name: 'findappeal',
  description: 'Finds a user\'s appeal',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.roles.cache.some(role => config.appealsManagerRole.includes(role.id))) {
      return message.channel.send('You do not have permission to run this command!')
    }
    if (!args[0]) return message.channel.send('You did not specify a user id!')
    try {
      let appeal = await db.query('SELECT * FROM appeals WHERE discord_id = $1;', [args[0]])
      if (appeal.rowCount === 0) return message.channel.send('This user doesn\'t have an open appeal!')
      appeal = appeal.rows[0]
      const reason = appeal.reason || 'No reason provided'
      const comment = appeal.comment || 'No comment provided'
      const embed = new Discord.MessageEmbed()
        .setTitle(`Appeal for ${appeal.username}#${('0000' + appeal.discriminator).slice(-4)} (${appeal.discord_id})`)
        .setColor(3756250)
        .setTimestamp()
        .addFields(
          { name: 'Reason for ban', value: reason },
          { name: 'Comment', value: comment },
          { name: 'Time', value: appeal.date }
        )
      await message.channel.send(embed)
    } catch (e) {
      console.error(e)
      return message.channel.send('An error occured when searching for that appeal!')
    }
  }
}
