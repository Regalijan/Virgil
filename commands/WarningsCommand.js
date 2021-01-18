const db = require('../database')
module.exports = {
  name: 'warnings',
  description: 'Displays warnings of member',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('KICK_MEMBERS') && !message.member.hasPermission('BAN_MEMBERS')) return message.channel.send('You do not have permission to run this command!')
    try {
      let member = message.author.id
      let validmember = true
      if (args.length > 0) member = args[0]
      if (member.match(/^<@!?[0-9]*>/) && args.length > 0) {
        member = message.mentions.members.first()
      } else if (args[0] && args[0].match(/\D/)) await message.guild.members.fetch({ query: args[0], limit: 1 }).then(result => result.mapValues(values => { member = values }))
      else if (args.length > 0 && args[0]) member = await message.guild.members.fetch(args[0]).catch(e => { if (e.httpStatus === 400) validmember = false })
      if (!validmember) await message.guild.members.fetch({ query: args[0], limit: 1 }).then(results => { results.mapValues(values => { member = values }) })
      const warnings = await db.query('SELECT * FROM punishments WHERE target = $1 AND server = $2 AND deleted = false;', [member, message.guild.id])
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
      return message.channel.send(embed)
    } catch (e) {
      console.error(e.stack)
    }
  }
}
