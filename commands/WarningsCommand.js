module.exports = {
  name: 'warnings',
  description: 'Displays warnings of member',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('KICK_MEMBERS') && !message.member.hasPermission('BAN_MEMBERS')) return message.channel.send('You do not have permission to run this command!')
    const db = require('../database')
    const { getuser } = require('../getuser')
    try {
      let member = message.member
      if (args.length > 0) member = await getuser(args.slice(0).join(' '), message)
      if (!member) return await message.channel.send('I could not find that member!')
      const warnings = await db.query('SELECT * FROM punishments WHERE target = $1 AND server = $2 AND deleted = false;', [member.id, message.guild.id])
      if (warnings.rowCount === 0) return message.channel.send('You do not have any warnings!')
      const { MessageEmbed } = require('discord.js')
      const embed = new MessageEmbed()
        .setAuthor(`${warnings.rowCount} warnings for ${member.user.tag} (${member.user.id})`, member.user.displayAvatarURL())
        .setColor(3756250)
      for (let i = 0; i < warnings.rowCount; i++) {
        let date = new Date(warnings.rows[i].time)
        date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
        embed.addField(`ID: ${warnings.rows[i].time}| Moderator: ${warnings.rows[i].moderator}`, `${warnings.rows[i].reason} - ${date}`)
      }
      await message.channel.send(embed, { split: true })
    } catch (e) {
      console.error(e.stack)
    }
  }
}
