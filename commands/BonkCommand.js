module.exports = {
  name: 'bonk',
  description: 'BONK!',
  guildOnly: true,
  async execute (message, args) {
    const { getuser } = require('../getuser')
    const { MessageEmbed } = require('discord.js')
    if (args.length === 0) return await message.channel.send('You did not choose someone to bonk!')
    const target = await getuser(args.slice(0).join(' '), message)
    const embed = new MessageEmbed()
      .setTitle('BONK!')
      .setImage('https://i.pinimg.com/originals/f7/30/3b/f7303b16c4d7902e88060de1ad3c9ed3.jpg')
      .setDescription(`${message.member} has bonked ${target}.`)
      .setColor(3756250)
    message.channel.send(embed)
  }
}
