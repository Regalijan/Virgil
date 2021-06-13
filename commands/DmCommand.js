module.exports = {
  name: 'dm',
  properName: 'Dm',
  description: 'Sends a dm to a user',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_GUILD')) return await message.channel.send('You cannot run this command!')
    const { prefix } = require('../config.json')
    if (args.length < 2) return await message.channel.send(`Usage: \`${prefix}dm <user> <message>\``)
    const { getuser } = require('../getuser')
    const user = await getuser(args[0], message)
    if (!user) return await message.channel.send('I could not find that member!')
    try {
      await user.send(args.slice(1).join(' ') + `\n\n- ${message.guild.name}`)
    } catch {
      return await message.channel.send('I could not dm this user!')
    }
    await message.channel.send('Message sent!')
  }
}
