const { owner } = require('../config.json')
module.exports = {
  name: 'exit',
  description: 'Exits the bot process',
  async execute (message) {
    if (message.author.id === owner) {
      await message.channel.send('Bye.')
      process.exit()
    } else {
      return message.channel.send('You tried.')
    }
  }
}
