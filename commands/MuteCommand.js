module.exports = {
  name: 'mute',
  properName: 'Mute',
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
    const { getuser } = require('../getuser')
    const member = await getuser(args[0], message)
    if (!member) return await message.channel.send('I could not find that member!')
    await member.roles.add(role).catch(e => {
      console.error(e)
      return message.channel.send('An error occured when muting the member!')
    })
  }
}
