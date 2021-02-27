module.exports = {
  name: 'warn',
  description: 'Issues a warning to a member',
  guildOnly: true,
  async execute (message, args) {
    const db = require('../database')
    const overrides = []
    const overridedata = await db.query('SELECT * FROM overrides WHERE guild = $1;', [message.guild.id])
    overridedata.rows.forEach(row => { if (row.type === ('warn' || 'mod')) overrides.push(row.role) })
    if (!message.member.hasPermission('MANAGE_MESSAGES') && !message.member.roles.cache.some(role => overrides.includes(role.id))) return
    const { prefix } = require('../config.json')
    if (!args[0]) return message.channel.send(`Usage: \`${prefix}warn <user> [reason]\``)
    const { MessageEmbed } = require('discord.js')
    let reason = args.slice(1).join(' ')
    const { getuser } = require('../getuser')
    const member = await getuser(args[0], message)
    if (!member) return await message.channel.send('I could not find that member!')
    if (!reason) reason = 'No reason provided'
    const embed = new MessageEmbed()
      .setColor(3756250)
    await db.query('INSERT INTO punishments(time,moderator,target,reason,type,server,deleted) VALUES($1,$2,$3,$4,$5,$6,$7);', [Date.now(), message.author.id, member.id, reason, 'warn', message.guild.id, 'f'])
      .catch(e => {
        console.error(e)
        return message.channel.send('An error occured when creating the warn!')
      })
    await member.send(`You have been warned in ${message.guild.name} for **${reason}**`).catch(() => {
      embed.setDescription(':x: I could not DM them.')
      return message.channel.send(embed)
    })
    await embed.setDescription(`${member.user.tag} was warned | ${reason}`)
    return message.channel.send(embed)
  }
}
