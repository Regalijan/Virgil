module.exports = {
  name: 'mentionable',
  properName: 'Mentionable',
  description: 'Makes a role mentionable',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_ROLES')) return message.channel.send('You do not have permission to run this command!')
    if (!args[0]) return message.channel.send('You did not give me a role!')
    let role = args.slice(0).join(' ')
    role = role.replace(/(<@&|>)/g, '')
    if (args[0].match(/^\d+$/)) role = message.guild.roles.cache.find(r => r.id === args[0])
    else role = message.guild.roles.cache.find(r => r.name.toLowerCase().includes(role.toLowerCase()))
    if (!message.guild.me.hasPermission('MANAGE_ROLES')) return message.channel.send('I do not have permission to manage roles.')
    if (!role) return message.channel.send('I could not find that role!')
    if (role.position >= message.guild.me.roles.highest.position) return message.channel.send('I cannot manage this role as it is not lower than my highest role.')
    if (!role.mentionable) {
      await role.setMentionable(true)
      return await message.channel.send(`${role.name} is now mentionable.`)
    }
    await role.setMentionable(false)
    await message.channel.send(`${role.name} is now unmentionable.`)
  }
}
