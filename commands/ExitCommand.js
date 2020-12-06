const { owner } = require('../config.json')
const { client } = require('../index')
module.exports = {
  name: 'exit',
  description: 'Exits the bot process',
  async execute (message) {
    if (message.author.id === owner) {
      await message.channel.send('Bye.')
      client.destroy()
      process.exit()
    } else {
      return message.channel.send('You tried.')
    }
  }
}
