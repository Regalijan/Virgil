module.exports = {
  name: 'hug',
  properName: 'Hug',
  description: 'Hug someone!',
  guildOnly: true,
  async execute (message, args) {
    const { getuser } = require('../getuser')
    const request = require('axios')
    if (args.length === 0) return await message.channel.send('I don\'t think it\'s physically possible to hug yourself.')
    const user = await getuser(args.slice(0).join(' '), message)
    if (!user) return await message.channel.send('Sorry, but you have been denied affection.')
    const media = await request('https://nekos.life/api/v2/img/hug').catch(() => {})
    if (!media) return await message.channel.send('The server decided you are not getting affection.')
    const { MessageEmbed } = require('discord.js')
    const embed = new MessageEmbed()
      .setImage(media.data.url)
      .setDescription(`${message.member} gives ${user} a big hug!`)
      .setColor(3756250)
    await message.channel.send(embed)
  }
}
