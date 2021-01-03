module.exports = {
  name: 'ignorecommands',
  description: 'Ignores a channel for commands',
  guildOnly: true,
  async execute (message, args) {
    const db = require('../database')
    const { prefix } = require('../config.json')
    if (!message.member.hasPermission('MANAGE_GUILD')) return message.channel.send('You do not have permission to run this command!')
    if (args.length === 0) return message.channel.send(`Usage: \`${prefix}ignorecommands <channel>\``)
    let channel = args[0]
    channel = channel.replace(/<#|>/g, '')
    const selected = message.guild.channels.cache.find(c => c.id === channel)
    if (!selected) return message.channel.send('I could not find that channel!')
    const check = await db.query('SELECT * FROM ignored WHERE snowflake = $1 AND type = \'command\';')
    if (check.rowCount > 0) return message.channel.send('This channel is already ignored!')
    try {
      await db.query('INSERT INTO ignored(snowflake,type,guild) VALUES($1,\'command\',$2);', [selected, message.guild.id])
      return message.channel.send(`<#${selected}> ignored!`)
    } catch (e) {
      console.error(e)
      return message.channel.send('An error occured when ignoring that channel!')
    }
  }
}
