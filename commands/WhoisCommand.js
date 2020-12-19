const Discord = require('discord.js')

module.exports = {
  name: 'whois',
  description: 'User lookup',
  guildOnly: true,
  async execute (message, args) {
    let member = message.member
    if (args[0] && args[0].match(/(^<@!?[0-9]*>)/)) member = message.mentions.members.first()
    else if (args[0]) member = await message.guild.members.fetch(args[0]).catch(e => console.error(e))
    const embed = new Discord.MessageEmbed()
      .setTitle('User Info')
      .setDescription(`Profile of ${member}`)
      .setColor(3756250)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: 'Username', value: member.user.tag},
        { name: 'User ID', value: member.id},
        { name: 'Highest Role', value: member.roles.highest, inline: true },
        { name: 'Created At', value: member.user.createdAt, inline: true },
        { name: 'Joined At', value: member.joinedAt, inline: true }
      )
    message.channel.send(embed)
  }
}
