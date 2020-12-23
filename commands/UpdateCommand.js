const verifier = require('../verify')

module.exports = {
  name: 'update',
  description: "Updates the target user's role bindings.",
  guildOnly: true,
  async execute (message, args) {
    const success = await verifier.run(message, args[0])
    if (success) {
      const member = message.guild.members.fetch(args[0])
      message.channel.send(`${member.displayName} has been updated!`)
    }
  }
}
