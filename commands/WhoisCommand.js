module.exports = {
  name: 'whois',
  description: 'User lookup',
  guildOnly: true,
  async execute (message, args) {
    const { getuser } = require('../getuser')
    let member = message.member
    if (args.length > 0) {
      member = getuser(args.slice(0).join(' '), message)
    }
    if (!member) member = message.member
    const { MessageEmbed } = require('discord.js')
    const embed = new MessageEmbed()
      .setTitle('User Info')
      .setDescription(`Profile of ${member}`)
      .setColor(3756250)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: 'Username', value: member.user.tag },
        { name: 'User ID', value: member.id },
        { name: 'Highest Role', value: member.roles.highest, inline: true },
        { name: 'Created At', value: member.user.createdAt, inline: true },
        { name: 'Joined At', value: member.joinedAt, inline: true }
      )
    await message.channel.send(embed)
  }
}
