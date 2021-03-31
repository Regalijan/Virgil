module.exports = {
  name: 'fact',
  properName: 'Fact',
  description: 'Displays random fact',
  async execute (message) {
    const request = require('axios')
    const fact = await request('https://nekos.life/api/v2/fact').catch(() => {})
    if (!fact) return await message.channel.send('The server decided no knowledge for you. (Request failed)')
    return await message.channel.send(fact.data.fact)
  }
}
