module.exports = {
  name: 'bonk',
  description: 'BONK!',
  guildOnly: true,
  async execute (message, args) {
    const { getuser } = require('../getuser')
    const { MessageEmbed } = require('discord.js')
    const query = args.slice(0).join(' ')
    const target = await getuser(query, message, message.guild)
    const embed = new MessageEmbed()
      .setTitle('BONK!')
      .setImage('https://i.pinimg.com/originals/f7/30/3b/f7303b16c4d7902e88060de1ad3c9ed3.jpg')
      .setDescription(`<@${message.author.id}> has bonked ${target}.`)
      .setColor(3756250)
    message.channel.send(embed)
  }
}
