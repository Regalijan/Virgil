module.exports = {
  name: 'deletelog',
  description: 'Sets delete log channel',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_GUILD')) return message.channel.send('You do not have permission to run this command!')
    const { prefix } = require('../config.json')
    if (args.length === 0) return message.channel.send(`Usage: \`${prefix}deletelog #channel\`\nThe channel can be a tag or an id.`)
    const chosenchannel = args[0].replace(/<#|>/g, '')
    const channel = message.guild.channels.cache.find(c => c.id === chosenchannel)
    if (!channel) return message.channel.send('I could not find that channel!')
    const db = require('../database')
    await db.query('UPDATE core_settings SET delete_log_channel = $1 WHERE guild_id = $2;', [chosenchannel, message.guild.id]).catch(e => {
      console.error(e)
      return message.channel.send('An error occured when setting the delete log channel!')
    })
    message.channel.send(`Delete logging channel set to ${channel}!`)
  }
}
