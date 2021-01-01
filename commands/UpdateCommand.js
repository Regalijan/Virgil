const verifier = require('../verify')

module.exports = {
  name: 'update',
  description: "Updates the target user's role bindings.",
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_GUILD')) return message.channel.send('You do not have permission to run this command!')
    if (!args[0]) return message.channel.send('No member was specified.')
    const status = await verifier.run(message, args[0])
    if (status === 1) {
      const member = await message.guild.members.fetch(args[0])
      message.channel.send(`${member.displayName} has been updated!`)
    }
  }
}
