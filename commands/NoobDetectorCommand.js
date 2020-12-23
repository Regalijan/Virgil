const Discord = require('discord.js')

module.exports = {
  name: 'noobdetector',
  description: 'Find out how much of a noob you are',
  async execute (message, args) {
    let validmember = true
    let member = message.member
    if (args[0] && args[0].match(/(^<@!?[0-9]*>)/)) member = message.mentions.members.first()
    else if (args[0] && args[0].match(/([A-z])/g)) await message.guild.members.fetch({ query: args[0], limit: 1 }).then(result => result.mapValues(values => { member = values }))
    else if (args[0]) member = await message.guild.members.fetch(args[0]).catch(e => { if (e.httpStatus === 400) validmember = false })
    if (!validmember) await message.guild.members.fetch({ query: args[0], limit: 1 }).then(results => { results.mapValues(values => { member = values }) })
    const embed = new Discord.MessageEmbed()
      .setTitle('Noob Detector')
      .setAuthor(member.user.tag, member.user.displayAvatarURL())
      .setColor(3756250)
      .addField('Noob Percentage', `${Math.round(Math.random() * 100)}%`)
    message.channel.send(embed)
  }
}
