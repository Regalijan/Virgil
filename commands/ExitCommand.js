module.exports = {
  name: 'exit',
  description: 'Exits the bot process',
  async execute (message) {
    const { app } = require('../index')
    if (message.author.id === app.owner.id) {
      await message.channel.send('Bye.')
      message.client.destroy()
      process.exit()
    } else {
      return message.channel.send('You tried.')
    }
  }
}
