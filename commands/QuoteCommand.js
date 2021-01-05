module.exports = {
  name: 'quote',
  description: 'Gets a quote from InspiroBot',
  async execute (message) {
    try {
      const request = require('axios').default
      const quotedata = await request('https://inspirobot.me/api', { responseType: 'text' })
      const { MessageEmbed } = require('discord.js')
      const embed = new MessageEmbed()
        .setTitle('Here is your quote.')
        .setColor(3756250)
        .setImage(quotedata.data)
      await message.channel.send(embed)
    } catch (e) {
      console.error(e)
      return message.channel.send('An error occured when fetching the quote!')
    }
  }
}
