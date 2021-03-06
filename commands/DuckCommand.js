module.exports = {
  name: 'duck',
  properName: 'Duck',
  description: 'Shows a random duck.',
  async execute (message) {
    try {
      const request = require('axios')
      const response = await request('https://random-d.uk/api/v2/random')
      const { MessageEmbed } = require('discord.js')
      const embed = new MessageEmbed()
        .setTitle(':duck: QUACK! A random duck for you!')
        .setColor(3756250)
        .setImage(response.data.url)
        .setFooter(response.data.message)
      return message.channel.send(embed)
    } catch (e) {
      console.error(e)
      return message.channel.send('Something broke on my end! If this keeps happening, contact the bot developer.')
    }
  }
}
