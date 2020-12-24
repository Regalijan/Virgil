const { owner } = require('../config.json')
module.exports = {
  name: 'say',
  description: 'Repeats text input',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_GUILD') && message.author.id !== owner) return message.channel.send('You do not have permission to run this command!')
    if (!args[0]) return message.channel.send('You did not provide a message.')
    let msg
    if (args[0].match(/(<#)\d+(>)/)) {
      msg = args.slice(1).join(' ')
      const c = message.guild.channels.cache.find(ch => ch.id === args[0].replace(/(<#|>)/g, ''))
      if (!c) return message.channel.send('I could not find that channel!')
      c.send(msg)
    } else {
      msg = args.slice(0).join(' ')
      message.channel.send(msg)
    }
    message.delete()
  }
}
