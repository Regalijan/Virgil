module.exports = {
  name: 'bonk',
  description: 'BONK!',
  guildOnly: true,
  async execute (message, args) {
    const { getuser } = require('../getuser')
    const { MessageEmbed } = require('discord.js')
    if (args.length === 0) return await message.channel.send('You did not choose someone to bonk!')
    let target = await getuser(args.slice(0).join(' '), message)
    if (!target) target = message.member
    const app = require('../index')
    const owner = (await app).owner.id
    let description = `${message.member} has bonked ${target}.`
    if (message.member.id === target.id) description = `${message.member} managed to bonk themselves!`
    else if (target.id === message.client.user.id) return await message.channel.send('You will *not* bonk me.')
    else if (target.id === owner && message.author.id !== owner) return await message.channel.send('I will not let you bonk my owner.')
    const embed = new MessageEmbed()
      .setTitle('BONK!')
      .setImage('https://i.pinimg.com/originals/f7/30/3b/f7303b16c4d7902e88060de1ad3c9ed3.jpg')
      .setDescription(description)
      .setColor(3756250)
    message.channel.send(embed)
  }
}
