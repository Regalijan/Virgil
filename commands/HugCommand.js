module.exports = {
  name: 'hug',
  properName: 'Hug',
  description: 'Hug someone!',
  guildOnly: true,
  async execute (message, args) {
    const media = ['https://i.imgur.com/JrnxI9M.gif', 'https://i.imgur.com/wQ63uWq.gif', 'https://i.imgur.com/l1a8pPB.gif', 'https://i.imgur.com/2CZIaWW.gif', 'https://i.imgur.com/NA0KTrW.gif', 'https://i.imgur.com/DfrcpsW.gif', 'https://i.imgur.com/zKDs4E4.gif', 'https://i.imgur.com/6Xgkuh0.gif', 'https://i.imgur.com/6VGJmQH.gif', 'https://i.imgur.com/PUGIfYr.gif', 'https://i.imgur.com/Gj0quBP.gif', 'https://i.imgur.com/axhxWEK.gif', 'https://i.imgur.com/SFhrpdI.gif', 'https://i.imgur.com/OTtWXbs.gif', 'https://i.imgur.com/3zGl5on.gif', 'https://i.imgur.com/wBbgpKQ.gif', 'https://i.imgur.com/muAzb8A.gif', 'https://i.imgur.com/Jr5YVQx.gif', 'https://i.imgur.com/Vz95HoQ.gif', 'https://i.imgur.com/NVSlQsr.gif', 'https://i.imgur.com/UefRSup.gif', 'https://i.imgur.com/GM5njAQ.gif', 'https://i.imgur.com/o1zH31L.gif']
    const { getuser } = require('../getuser')
    if (args.length === 0) return await message.channel.send('I don\'t think it\'s physically possible to hug yourself.')
    const user = await getuser(args.slice(0).join(' '), message)
    if (!user) return await message.channel.send('Sorry, but you have been denied affection.')
    const { MessageEmbed } = require('discord.js')
    const index = Math.round(Math.random() * (media.length - 1))
    const embed = new MessageEmbed()
      .setImage(media[index])
      .setDescription(`${message.member} gives ${user} a big hug!`)
      .setColor(3756250)
    await message.channel.send(embed)
  }
}
