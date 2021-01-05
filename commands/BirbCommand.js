module.exports = {
  name: 'birb',
  description: 'Finds image of birb',
  async execute (message) {
    const request = require('axios')
    const imglist = await request('https://random.birb.pw/img/', { responseType: 'text' })
    const imagematches = imglist.data.match(/\/img\/\S[^.<]*\.[A-z]*/g)
    const selectedindex = Math.round(Math.random() * (imagematches.length - 1))
    const { MessageEmbed } = require('discord.js')
    const embed = new MessageEmbed()
      .setTitle('Tweet Tweet...')
      .setColor(3756250)
      .setImage(`https://random.birb.pw${imagematches[selectedindex]}`)
    await message.channel.send(embed)
  }
}
