const verifier = require('../verify')

module.exports = {
  name: 'update',
  description: "Updates the target user's role bindings.",
  guildOnly: true,
  async execute (message, args) {
    const status = await verifier.run(message, args[0])
    if (status.content === ':scroll: Fetching information from Roblox...') {
      const member = await message.guild.members.fetch(args[0])
      status.edit(`${member.displayName} has been updated!`)
    }
  }
}
