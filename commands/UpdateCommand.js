module.exports = {
  name: 'update',
  properName: 'Update',
  description: "Updates the target user's role bindings.",
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_GUILD')) return message.channel.send('You do not have permission to run this command!')
    if (!args[0]) return message.channel.send('No member was specified.')
    let user = args[0]
    user = user.replace(/<@!?|>/g, '')
    const verifier = require('../verify')
    const status = await verifier.run(message, user)
    if (status === 1) {
      const member = await message.guild.members.fetch(user)
      message.channel.send(`${member.displayName} has been updated!`)
    }
  }
}
