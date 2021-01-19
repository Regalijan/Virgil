module.exports = {
  name: 'kick',
  description: 'This should be obvious',
  guildOnly: true,
  async execute (message, args) {
    const db = require('../database')
    let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [message.guild.id])
    serversettings = serversettings.rows[0]
    let reason = args.slice(1).join(' ')
    let validmember = true
    const hasmodrole = await db.query('SELECT * FROM overrides WHERE guild = $1;', [message.guild.id])
    const overrides = []
    hasmodrole.rows.forEach(row => { if (row.type === 'kick' || row.type === 'mod') overrides.push(row.role) })
    if (!message.member.hasPermission('KICK_MEMBERS') && !message.member.roles.cache.some(r => overrides.includes(r.id.toString()))) return message.channel.send('You cannot run this command.')
    if (!args[0]) return message.channel.send('I can\'t kick air.')
    let member = args[0]
    if (member.match(/^<@!?[0-9]*>/)) {
      member = message.mentions.members.first()
    } else if (args[0] && args[0].match(/\D/)) await message.guild.members.fetch({ query: args[0], limit: 1 }).then(result => result.mapValues(values => { member = values }))
    else if (args[0]) member = await message.guild.members.fetch(args[0]).catch(e => { if (e.httpStatus === 400) validmember = false })
    if (!validmember) await message.guild.members.fetch({ query: args[0], limit: 1 }).then(results => { results.mapValues(values => { member = values }) })
    if (message.author.id === member.user.id) return message.channel.send('You are **not** kicking yourself.')
    if (!member) return message.channel.send('An error occured when fetching the member!')
    if (member.roles.cache.some(r => overrides.includes(r.id.toString()))) return message.channel.send('I cannot kick moderators.')
    if (!member.kickable) return message.channel.send('This user cannot be kicked!')
    if (!reason) reason = 'No reason provided.'
    if (!member.manageable) return message.channel.send('I cannot kick that member as their highest role is equal to/higher than mine!')
    await member.user.send(`You have been kicked from ${message.guild.name}: ${reason}`).catch(() => {})
    await member.kick({ reason: reason }).catch(e => {
      console.error(e)
      return message.channel.send(`I could not kick that user! ${e}`)
    })
    await message.channel.send(`${member.user.tag} was kicked! | ${reason}`)
    const channel = message.guild.cache.channels.find(ch => ch.id === serversettings.mod_log_channel.toString())
    if (!channel) return
    const { MessageEmbed } = require('discord.js')
    const embed = new MessageEmbed()
      .setAuthor(`Kick | ${member.user.tag}`, member.displayAvatarURL())
      .addFields(
        { name: 'User', value: `${member}`, inline: true },
        { name: 'Moderator', value: message.member, inline: true },
        { name: 'Reason', value: reason, inline: true }
      )
    channel.send(embed).catch(e => console.error(e))
  }
}
