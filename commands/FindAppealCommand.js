module.exports = {
  name: 'findappeal',
  description: 'Finds a user\'s appeal',
  guildOnly: true,
  async execute (message, args) {
    const db = require('../database')
    const useroverridecheck = await db.query('SELECT * FROM appeals_managers WHERE type = \'user\' AND guild = $1 AND id = $2;', [message.guild.id, message.author.id])
    const roleoverridecheck = await db.query('SELECT * FROM appeals_managers WHERE guild = $1 AND type = \'role\';', [message.guild.id])
    const overrides = []
    roleoverridecheck.rows.forEach(row => overrides.push(row.id.toString()))
    if (useroverridecheck.rowCount === 0 && !message.member.roles.cache.some(role => overrides.includes(role.id)) && !message.member.hasPermission('ADMINISTRATOR')) return
    if (!args[0]) return message.channel.send('You did not specify a user id!')
    try {
      let appeal = await db.query('SELECT appeals.discord_id, auth.username, auth.discriminator, appeals.reason, appeals.comment, appeals.why, appeals.date FROM appeals,auth where appeals.discord_id = $1 AND auth.discord_id = $1;', [args[0]])
      if (appeal.rowCount === 0) return message.channel.send('This user doesn\'t have an open appeal!')
      appeal = appeal.rows[0]
      const reason = appeal.reason || 'No reason provided'
      const why = appeal.why || 'No response provided'
      const comment = appeal.comment || 'No comment provided'
      const { MessageEmbed } = require('discord.js')
      const embed = new MessageEmbed()
        .setTitle(`Appeal for ${appeal.username}#${('0000' + appeal.discriminator).slice(-4)} (${appeal.discord_id})`)
        .setColor(3756250)
        .setTimestamp()
        .addFields(
          { name: 'Reason for ban', value: reason },
          { name: 'Comment', value: comment },
          { name: 'Why they believe they should be unbanned', value: why },
          { name: 'Time', value: appeal.date }
        )
      await message.channel.send(embed)
    } catch (e) {
      console.error(e)
      return message.channel.send('An error occured when searching for that appeal!')
    }
  }
}
