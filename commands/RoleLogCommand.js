module.exports = {
  name: 'rolelog',
  properName: 'RoleLog',
  description: 'Sets role log channel',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_GUILD')) return message.channel.send('You do not have permission to run this command!')
    const { prefix } = require('../config.json')
    if (args.length === 0) return message.channel.send(`Usage: \`${prefix}rolelog #channel\`\nThe channel can be a tag or ID.`)
    const choice = args[0].replace(/<#|>/g, '')
    const channel = message.guild.channels.cache.find(c => c.id === choice)
    if (!channel) return message.channel.send('This channel could not be found!')
    const db = require('../database')
    const query = await db.query('UPDATE core_settings SET role_log_channel = $1 WHERE guild_id = $2;', [channel.id, message.guild.id]).catch(e => console.error(e))
    if (!query) return message.channel.send('An error occured when setting the log channel!')
    message.channel.send(`Role logging channel set to ${channel}!`)
  }
}
