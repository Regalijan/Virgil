const verifier = require('../verify')

module.exports = {
  name: 'verify',
  description: 'Adds roles based on your roblox badges and group rank (if applicable).',
  guildOnly: true,
  async execute (message) {
    const success = await verifier.run(message, message.author.id)
    if (success) return message.reply('You have been verified!')
  }
}
