module.exports = {
  name: 'verify',
  description: 'Adds roles based on your roblox badges and group rank (if applicable).',
  guildOnly: true,
  async execute (message) {
    const verifier = require('../verify')
    const status = await verifier.run(message, message.author.id)
    if (status === 1) message.channel.send('Verification Complete')
  }
}
