module.exports = {
  name: 'unignorecommands',
  properName: 'UnignoreCommands',
  description: 'Unignores commands in a channel',
  guildOnly: true,
  async execute (message, args) {
    const db = require('../database')
    const { prefix } = require('../config.json')
    if (!message.member.hasPermission('MANAGE_GUILD')) return message.channel.send('You do not have permission to run this command!')
    if (args.length === 0) return message.channel.send(`Usage: \`${prefix}unignorecommands <channel>\``)
    let channel = args[0]
    channel = channel.replace(/<#|>/g, '')
    try {
      await db.query('DELETE FROM ignored WHERE snowflake = $1 AND guild = $2;', [channel, message.guild.id])
      return message.channel.send(`<#${channel}> unignored!`)
    } catch (e) {
      console.error(e)
      return message.channel.send('An error occured when unignoring the channel!')
    }
  }
}
