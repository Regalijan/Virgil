module.exports = {
  name: 'editlog',
  properName: 'EditLog',
  description: 'Sets edit log channel',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_GUILD')) return message.channel.send('You do not have permission to run this command!')
    const { prefix } = require('../config.json')
    if (args.length === 0) return message.channel.send(`Usage: \`${prefix}editlog #channel\`\nThe channel can be a tag or an id.`)
    const chosenchannel = args[0].replace(/<#|>/g, '')
    const channel = message.guild.channels.cache.find(c => c.id === chosenchannel)
    if (!channel) return message.channel.send('I could not find that channel!')
    const db = require('../database')
    await db.query('UPDATE core_settings SET edit_log_channel = $1 WHERE guild_id = $2;', [chosenchannel, message.guild.id]).catch(e => {
      console.error(e)
      return message.channel.send('An error occured when setting the edit log channel!')
    })
    message.channel.send(`Edit logging channel set to ${channel}!`)
  }
}
