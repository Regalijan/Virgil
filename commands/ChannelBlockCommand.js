const { MessageEmbed } = require('discord.js')
const { prefix } = require('../config.json')
module.exports = {
  name: 'channelblock',
  description: 'Prevents a user from talking in a specific channel',
  guildOnly: true,
  async execute (message, args) {
    if (args.length < 2) return message.channel.send(`Usage: \`${prefix}channelblock <#channel> <@user>\``)
    if (!message.guild.me.hasPermission('MANAGE_CHANNELS')) return message.channel.send('I cannot modify channel settings as I do not have the manage channels permission.')
    let channel = args[0]
    channel = channel.replace(/(<#|>)/g, '')
    channel = await message.guild.channels.cache.find(c => c.id === channel)
    if (!channel) return message.channel.send('I could not find that channel!')
    let user = args[1]
    let validmember = true
    if (user.match(/(^<@!?[0-9]*>)/)) user = message.mentions.members.first()
    else if (user.match(/([A-z])/)) await message.guild.members.fetch({ query: args[0], limit: 1 }).then(result => result.mapValues(values => { user = values }))
    else user = await message.guild.members.fetch(args[0]).catch(e => { if (e.httpStatus === 400) validmember = false })
    if (!validmember) await message.guild.members.fetch({ query: args[0], limit: 1 }).then(results => { results.mapValues(values => { user = values }) })
    channel.createOverwrite(user, { SEND_MESSAGES: false }).catch(e => {
      console.error(e)
      return message.channel.send(e)
    })
    const embed = new MessageEmbed()
      .setAuthor(message.author.tag, message.author.displayAvatarURL())
      .setColor(3756250)
      .setDescription(`${user} blocked from sending messages in ${channel}!`)
    message.channel.send(embed)
  }
}
