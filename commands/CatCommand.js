module.exports = {
  name: 'cat',
  properName: 'Cat',
  description: 'Gets cat image',
  async execute (message) {
    const request = require('axios')
    const cat = await request('https://nekos.life/api/v2/img/meow').catch(() => {})
    if (!cat) return await message.channel.send('An error occured :(')
    const { MessageEmbed } = require('discord.js')
    const embed = new MessageEmbed()
      .setTitle('Meow :cat:')
      .setColor(3756250)
      .setImage(cat.data.url)
      .setAuthor(message.author.tag, message.author.displayAvatarURL())
    await message.channel.send(embed).catch(() => {})
  }
}
