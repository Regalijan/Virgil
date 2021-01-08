module.exports = {
  name: 'dog',
  description: 'Gets dog picture',
  async execute (message) {
    const request = require('axios')
    const { MessageEmbed } = require('discord.js')
    try {
      const doglink = await request('https://dog.ceo/api/breeds/image/random')
      const embed = new MessageEmbed()
        .setTitle(':dog: Woof!')
        .setColor(3756250)
        .setImage(doglink.data.message)
      await message.channel.send(embed)
    } catch (e) {
      console.error(e)
      return message.channel.send('An error occured when fetching your dog, I apologize ;-;')
    }
  }
}
