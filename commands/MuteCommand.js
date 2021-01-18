module.exports = {
  name: 'mute',
  description: 'What do you think this does lmfao',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('KICK_MEMBERS') && !message.member.hasPermission('BAN_MEMBERS')) return message.channel.send('You do not have permission to run this command!')
    if (!message.guild.me.hasPermission('MANAGE_ROLES')) return message.channel.send('I cannot run this command as I do not have permission to manage roles!')
    const { prefix } = require('../config.json')
    if (args.length === 0) return message.channel.send(`Usage: \`${prefix}mute <user> [number] [measurement]\`\nMeasurements can be (h)ours, (m)inutes, or (d)ays.`)
    const db = require('../database')
    let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [message.guild.id])
    serversettings = serversettings.rows[0]
    if (!serversettings.mute_role) return
    const role = message.guild.roles.cache.find(c => c.id === serversettings.mute_role.toString())
    if (!role) return message.channel.send('I could not mute as the role could not be found!')
    let member = args[0]
    let validmember = true
    if (member.match(/^<@!?[0-9]*>/)) {
      member = message.mentions.members.first()
    } else if (args[0].match(/\D/)) await message.guild.members.fetch({ query: args[0], limit: 1 }).then(result => result.mapValues(values => { member = values }))
    else if (args[0]) member = await message.guild.members.fetch(args[0]).catch(e => { if (e.httpStatus === 400) validmember = false })
    if (!validmember) await message.guild.members.fetch({ query: args[0], limit: 1 }).then(results => { results.mapValues(values => { member = values }) })
    await member.roles.add(role)
  }
}
