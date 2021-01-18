module.exports = {
  name: 'warn',
  description: 'Issues a warning to a member',
  guildOnly: true,
  async execute (message, args) {
    const { prefix } = require('../config.json')
    if (!args[0]) return message.channel.send(`Usage: \`${prefix}warn <user> [reason]\``)
    const db = require('../database')
    const { MessageEmbed } = require('discord.js')
    let reason = args.slice(1).join(' ')
    let member
    let validmember = false
    if (member.match(/^<@!?[0-9]*>/)) {
      member = message.mentions.members.first()
    } else if (args[0] && args[0].match(/\D/)) await message.guild.members.fetch({ query: args[0], limit: 1 }).then(result => result.mapValues(values => { member = values }))
    else if (args[0]) member = await message.guild.members.fetch(args[0]).catch(e => { if (e.httpStatus === 400) validmember = false })
    if (!validmember) await message.guild.members.fetch({ query: args[0], limit: 1 }).then(results => { results.mapValues(values => { member = values }) })
    if (!member) return message.channel.send('I could not find this user!')
    member = member.id
    if (!reason) reason = 'No reason provided'
    const embed = new MessageEmbed()
      .setColor(3756250)
    await db.query('INSERT INTO punishments(time,moderator,target,reason,type,server,deleted) VALUES($1,$2,$3,$4,$5,$6,$7);', [Date.now(), message.author.id, member, reason, 'warn', message.guild.id, 'f'])
      .catch(e => {
        console.error(e)
        return message.channel.send('An error occured when creating the warn!')
      })
    await member.send(`You have been warned in ${message.guild.name} for **${reason}**`).catch(() => {
      embed.setDescription(':x: I could not DM them.')
      return message.channel.send(embed)
    })
    embed.setDescription(`${member.user.tag} was warned | ${reason}`)
    return message.channel.send(embed)
  }
}
