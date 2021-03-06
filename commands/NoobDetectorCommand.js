module.exports = {
  name: 'noobdetector',
  properName: 'NoobDetector',
  description: 'Find out how much of a noob you are',
  async execute (message, args) {
    const { getuser } = require('../getuser')
    let member = message.member
    if (args.length > 0) member = await getuser(args.slice(0).join(' '), message)
    if (!member) member = message.member
    const { MessageEmbed } = require('discord.js')
    const embed = new MessageEmbed()
      .setTitle('Noob Detector')
      .setAuthor(member.user.tag, member.user.displayAvatarURL())
      .setColor(3756250)
      .addField('Noob Percentage', `${Math.round(Math.random() * 100)}%`)
    await message.channel.send(embed)
  }
}
