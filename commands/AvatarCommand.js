module.exports = {
  name: 'avatar',
  properName: 'Avatar',
  description: 'Displays a user\'s avatar',
  guildOnly: true,
  async execute (message, args) {
    const { MessageEmbed } = require('discord.js')
    let member = message.member
    let validmember = true
    if (args[0] && args[0].match(/(^<@!?[0-9]*>)/)) member = message.mentions.members.first()
    else if (args[0] && args[0].match(/([A-z])/g)) await message.guild.members.fetch({ query: args[0], limit: 1 }).then(result => result.mapValues(values => { member = values }))
    else if (args[0]) member = await message.guild.members.fetch(args[0]).catch(e => { if (e.httpStatus === 400) validmember = false })
    if (!validmember) await message.guild.members.fetch({ query: args[0], limit: 1 }).then(results => { results.mapValues(values => { member = values }) })
    const embed = new MessageEmbed()
      .setAuthor(member.user.tag, member.user.displayAvatarURL())
      .setTitle('Avatar')
      .setColor(3756250)
      .setImage(member.user.displayAvatarURL({ dynamic: true, size: 4096 }))
    await message.channel.send(embed)
  }
}
