const db = require('../database')
const Discord = require('discord.js')

module.exports = {
  name: 'warnings',
  description: 'Displays warnings of member',
  guildOnly: true,
  async execute (message, args) {
    const { moderatorRoles } = require(`../serversettings/${message.guild.id}.json`)
    if (!message.member.roles.cache.find(role => moderatorRoles.includes(role.id))) return message.channel.send('You do not have permission to run this command!')
    try {
      let member = message.author.id
      if (member.match(/(^<@!?[0-9]*>)/)) {
        member = message.mentions.members.first().id
      } else {
        member = message.guild.members.fetch(args[0]).id
      }
      const warnings = await db.query('SELECT * FROM punishments WHERE target = $1 AND server = $2 AND deleted = false;', [member, message.guild.id])
      if (warnings.rowCount > 0) {
        const embed = new Discord.MessageEmbed()
          .setAuthor(`${warnings.rowCount} warnings for ${member.user.tag} (${member.user.id})`, member.user.displayAvatarURL())
          .setColor(3756250)
        for (let i = 0; i < warnings.rowCount; i++) {
          let date = new Date(warnings.rows[i].time)
          date = `${date.getFullYear}-${date.getMonth++}-${date.getDate}`
          embed.addField(`ID: ${warnings.rows[i].time}| Moderator: ${warnings.rows[i].moderator}`, `${warnings.rows[i].reason} - ${date}`)
        }
        return message.channel.send(embed)
      }
      return message.channel.send('You do not have any warnings!')
    } catch (e) {
      console.error(e.stack)
    }
  }
}
