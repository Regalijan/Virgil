const verifier = require('../verify')

module.exports = {
  name: 'verify',
  description: 'Adds roles based on your roblox badges and group rank (if applicable).',
  guildOnly: true,
  async execute (message) {
    const status = await verifier.run(message, message.author.id)
    if (status.content === ':scroll: Fetching information from Roblox...' || status.content === ':scroll: Checking the verification registries...') status.edit('Verification Complete!')
  }
}
