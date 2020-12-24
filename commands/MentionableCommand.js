const { owner } = require('../config.json')
module.exports = {
  name: 'mentionable',
  description: 'Makes a role mentionable',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_ROLES') && message.author.id !== owner) return message.channel.send('You do not have permission to run this command!')
    if (!args[0]) return message.channel.send('You did not give me a role!')
    let role = args[0]
    if (role.match(/(<@&[0-9]*>)/)) role = role.replace(/(<@&|>)/g, '')
    if (args[0].match(/^\d+$/)) role = message.guild.roles.cache.find(r => r.id === args[0])
    else role = message.guild.roles.cache.find(r => r.name.toLowerCase().includes(role.toLowerCase()))
    if (!message.guild.me.hasPermission('MANAGE_ROLES')) return message.channel.send('I do not have permission to manage roles.')
    if (!role) return message.channel.send('I could not find that role!')
    if (role.position >= message.guild.me.roles.highest.position) return message.channel.send('I cannot manage this role as it is not lower than my highest role.')
    role.setMentionable(true).catch(e => {
      console.error(e)
      return message.channel.send('An error occured when making that role mentionable!')
    })
    message.channel.send(`${role.name} is now mentionable.`)
  }
}
