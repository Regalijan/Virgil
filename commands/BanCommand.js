module.exports = {
  name: 'ban',
  description: 'What do you think this does lol.',
  guildOnly: true,
  async execute (message, args) {
    const db = require('../database')
    const { getuser } = require('../getuser')
    const { MessageEmbed } = require('discord.js')
    let serversettings = db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [message.guild.id])
    let reason = args.slice(1).join(' ')
    const overrides = []
    const overridedata = await db.query('SELECT * FROM overrides WHERE guild = $1;', [message.guild.id])
    overridedata.rows.forEach(row => { if (row.type === ('ban' || 'mod')) overrides.push(row.role) })
    if (!message.member.hasPermission('BAN_MEMBERS') && !message.member.roles.cache.some(role => overrides.includes(role.id))) return
    const { prefix } = require('../config.json')
    if (args.length === 0) return message.channel.send(`Usage: \`${prefix}ban <user> [reason]\``)
    const member = await getuser(args[0], message)
    if (!member) return message.channel.send('I could not find this user!')
    if (message.author.id === member.id) return message.channel.send('You will **not** ban yourself.')
    if (member.roles.cache.some(role => overrides.includes(role.id.toString()))) return message.channel.send('I cannot ban moderators.')
    if (!message.guild.member(member).bannable) return message.channel.send('This user cannot be banned!')
    if (!reason) reason = 'No reason provided.'
    await member.send(`You have been banned from ${message.guild.name}\nReason: ${reason}`).catch(() => {})
    message.guild.members.ban(member, { reason: reason })
      .then(user => message.channel.send(`${user.user.tag} was banned! | ${reason}`))
      .catch(e => {
        console.error(e.stack)
        return message.channel.send(`I could not ban that user! ${e}`)
      })
    if (serversettings.rowCount === 0) return
    serversettings = serversettings.rows[0]
    if (!serversettings.ban_log_channel) return
    const channel = message.guild.channels.cache.find(ch => ch.id === serversettings.ban_log_channel.toString())
    if (!channel) return
    const embed = new MessageEmbed()
      .setAuthor(`Ban | ${member.user.tag}`, member.displayAvatarURL())
      .addFields(
        { name: 'User', value: `${member}`, inline: true },
        { name: 'Moderator', value: message.member, inline: true },
        { name: 'Reason', value: reason, inline: true }
      )
    if (channel) return channel.send(embed).catch(e => console.error(e))
  }
}
