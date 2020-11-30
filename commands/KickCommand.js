const Discord = require('discord.js')

module.exports = {
  name: 'kick',
  description: 'This should be obvious',
  guildOnly: true,
  execute (message, args) {
    const serversettings = require(`../serversettings/${message.guild.id}.json`)
    let reason = args.slice(1).join(' ')
    if ((!message.member.hasPermission('KICK_MEMBERS')) || (!message.member.roles.cache.some(role => serversettings.permissionOverrideRoles.includes(role.id)))) return message.channel.send('You cannot run this command.')
    if (!args[0]) return message.channel.send('I can\'t kick air.')
    let member = args[0]
    if (member.match(/(^<@!?[0-9]*>)/)) {
      member = message.mentions.members.first()
    } else if (message.guild.member(member)) member = message.guild.member(member)
    if (message.author == member.user) return message.channel.send('Dumbass, why would you want to ban yourself?')
    if (member.roles.cache) {
      if (member.roles.cache.find(role => serversettings.moderatorRoles.includes(role.id))) return message.channel.send('I cannot kick moderators.')
    }
    if (!message.guild.member(member).kickable) return message.channel.send('This user cannot be kicked!')
    if (!reason) {
      reason = 'No reason provided.'
    }
    member.user.send(`You have been kicked from ${message.guild.name}: ${reason}`).catch()
    message.guild.members.kick(member, { reason: reason })
      .then(user => message.channel.send(`${user.user.tag} was kicked! | ${reason}`))
      .catch(e => {
        console.error(e.stack)
        return message.channel.send(`I could not kick that user! ${e}`)
      })
    const channel = message.guild.cache.channels.find(ch => ch.id == serversettings.modLogChannel)
    const embed = new Discord.MessageEmbed()
      .setAuthor(`Kick | ${member.user.tag}`, member.displayAvatarURL())
      .addFields(
        { name: 'User', value: `${member}`, inline: true },
        { name: 'Moderator', value: message.member, inline: true },
        { name: 'Reason', value: reason, inline: true }
      )
    if (channel) return channel.send(embed).catch(e => console.error(e))
  }
}
