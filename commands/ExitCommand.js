const { client } = require('../index')
module.exports = {
  name: 'exit',
  description: 'Exits the bot process',
  async execute (message) {
    const app = await client.fetchApplication()
    if (message.author.id === app.owner.id) {
      await message.channel.send('Bye.')
      client.destroy()
      process.exit()
    } else {
      return message.channel.send('You tried.')
    }
  }
}
